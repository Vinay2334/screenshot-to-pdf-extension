let lastCaptureTime = 0;
chrome.commands.onCommand.addListener((command, tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];

      const currentTime = Date.now();

      //Prevent to MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND EXCEEDED condition
      const delay = currentTime - lastCaptureTime;
      console.log(delay);
      if (delay <= 1000) {
        return;
      }

      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: "png" },
        (dataUrl) => {
          chrome.storage.local.get({ screenshots: [] }, (result) => {
            const screenshots = result.screenshots;
            const newScreenshot = {
              dataUrl: dataUrl,
              status: "idle",
            };
            screenshots.push(newScreenshot);
            chrome.storage.local.set({ screenshots }, () => {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  files: ["notification.js"],
                },
                () => {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                      if (window.showNotification) {
                        window.showNotification();
                      }
                    },
                  });
                }
              );
            });
          });
          lastCaptureTime = currentTime;
        }
      );
    }
  });
});

chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension is being suspended. Clearing storage...");
  chrome.storage.local.clear(() => {
    console.log("Storage cleared.");
  });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type } = message;
  if (type === "send") {
    chrome.storage.local.set({screenshots_upload_status : "Uploading"});
    const client_id = Math.floor(
      Date.now() + Math.random() * (9999 - 1000) + 1000
    );
    chrome.storage.local.get({ screenshots: [] }, async (result) => {
      let screenshot_val = result.screenshots;

      //Make the status as pending before statring upload to show the loader

      screenshot_val = screenshot_val.map((sc) => ({
        ...sc,
        status: "pending",
      }));

      chrome.storage.local.set({ screenshots: screenshot_val }, () => {
        console.log(chrome.storage.local.get("screenshots"));
        let received_image_idx = 0;
        console.log(client_id);
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${client_id}`);
        // console.log(screenshots);
        socket.onopen = () => {
          console.log("WebSocket connection established");
          screenshot_val.forEach((screenshot, index) => {
            if (screenshot.dataUrl) {
              socket.send(
                JSON.stringify({ type: "image", image: screenshot.dataUrl })
              );
            }
            //Revert to idle after upload is finished
            screenshot_val[index].status = "idle";
            chrome.storage.local.set({ screenshots: screenshot_val });
          });

          // Notify the server that all images have been sent
          socket.send(JSON.stringify({ type: "finish" }));
        };

        socket.onmessage = (event) => {
          const response = JSON.parse(event.data);
          console.log("Server response:", response);

          if (
            response.status === "image received" &&
            received_image_idx < screenshot_val.length
          ) {
            //Revert to idle after upload is finished
            screenshot_val[received_image_idx++].status = "idle";
            chrome.storage.local.set({ screenshots: screenshot_val });
          }

          if (response.status === "PDF created") {
            chrome.downloads.download(
              {
                url: response.url,
              },
              (downloadId) => {
                if (downloadId) {
                  console.log(`Download started with ID: ${downloadId}`);
                  chrome.storage.local.set({screenshots_upload_status : "Convert to PDF"});
                  chrome.downloads.onChanged.addListener(async (delta) => {
                    if (delta.id === downloadId && delta.state) {
                      if (delta.state.current === "complete") {
                        console.log("Download completed.");

                        // Delete the PDF file from the server
                        try {
                          const response = await fetch(
                            `http://127.0.0.1:8000/deletepdf/${client_id}`
                          );
                          if (response.ok) {
                            console.log("PDF file deleted from server.");
                          } else {
                            console.error(
                              "Failed to delete PDF file from server."
                            );
                          }
                        } catch (error) {
                          console.error("Error during fetch:", error);
                        }
                      }
                    }
                  });
                } else {
                  console.log("Failed to start download");
                }
              }
            );
          }
          // chrome.storage.local.clear(() => {
          //   console.log("Storage cleared.");
          // });
        };

        socket.onerror = (error) => {
          screenshot_val = screenshot_val.map((sc) => ({
            ...sc,
            status: "idle",
          }));
          console.log(screenshot_val);
          chrome.storage.local.set({ screenshots: screenshot_val });
          chrome.storage.local.set({screenshots_upload_status : "Convert to PDF"});
          console.error("WebSocket error:", error);
        };

        socket.onclose = async () => {
          console.log("WebSocket connection closed");
        };
      });
    });
  }
});
