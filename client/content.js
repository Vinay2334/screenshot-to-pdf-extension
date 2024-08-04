console.log("loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "capture") {
    console.log(message);
    document.body.style.transition = "background-color 2s";
    document.body.style.backgroundColor = "yellow";
    setTimeout(() => {
      document.body.style.backgroundColor = "";
    }, 200);
  }
});