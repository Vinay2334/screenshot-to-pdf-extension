chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`Command: ${command}`);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];

      chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: "png" },
        (dataUrl) => {
          chrome.storage.local.get({ screenshots: [] }, (result) => {
            const screenshots = result.screenshots;
            screenshots.push(dataUrl);
            chrome.storage.local.set({ screenshots }, () => {
              console.log("Screenshot captured and stored.");
            });
          });
        }
      );
    }
  });
});

chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension is being suspended. Clearing storage...');
  chrome.storage.local.clear(() => {
    console.log('Storage cleared.');
  });
});