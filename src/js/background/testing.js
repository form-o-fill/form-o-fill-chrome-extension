/*global Logger */
// Listener for messages from content.js -> testing.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

  if (message.action === "setTestingMode") {
    /*eslint-disable no-undef, block-scoped-var*/
    testingMode = message.value;
    /*eslint-enable no-undef, block-scoped-var*/

    // useful info to display in the testing page
    var info = {
      testingMode: message.value,
      extensionId: sender.id,
      tabId: sender.tab.id
    };
    Logger.info("[b/testing.js] Set testingMode to " + message.value);

    sendResponse(info);
  }
});
