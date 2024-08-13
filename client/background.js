chrome.commands.onCommand.addListener((command, tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;
  if (type === "send") {
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
        const socket = new WebSocket("ws://127.0.0.1:8000/ws");
        // console.log(screenshots);
        socket.onopen = () => {
          console.log("WebSocket connection established");

          screenshot_val.forEach((screenshot, index) => {
            socket.send(
              JSON.stringify({ type: "image", image: screenshot.dataUrl })
            );

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
          console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
          console.log("WebSocket connection closed");
          console.log("Aster upload", chrome.storage.local.get("screenshots"));
        };
      });
    });
  }
});
