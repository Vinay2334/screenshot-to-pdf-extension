chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`Command: ${command}`);
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];

      // chrome.tabs.sendMessage(tab.id, { type: "capture" });

      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: "png" },
        (dataUrl) => {
          chrome.storage.local.get({ screenshots: [] }, (result) => {
            const screenshots = result.screenshots;
            screenshots.push(dataUrl);
            console.log(dataUrl);
            chrome.storage.local.set({ screenshots }, () => {
              console.log("Screenshot captured and stored.");
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
                        window.showNotification(
                          "Screenshot captured."
                        );
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
    chrome.storage.local.get({ screenshots: [] }, (result) => {
      const screenshots = result.screenshots;
      const socket = new WebSocket("ws://127.0.0.1:8000/ws");

      socket.onopen = () => {
        console.log("WebSocket connection established");

        screenshots.forEach((screenshot, index) => {
          socket.send(JSON.stringify({ type: "image", image: screenshot }));
          console.log("send");
        });

        // Notify the server that all images have been sent
        socket.send(JSON.stringify({ type: "finish" }));
      };

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log("Server response:", response);

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
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    });
  }
});
