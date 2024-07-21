console.log("Contewrfew");
chrome.runtime.onMessage.addListener(mess);
function mess(message, sender, sendResponse){
  console.log(message);
}