/*eslint no-unused-vars:0 */
/*global Logger Utils lastActiveTab */

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
      extensionVersion: Utils.version,
      tabId: sender.tab.id
    };
    Logger.info("[b/testing.js] Set testingMode to " + message.value);

    sendResponse(info);
  }
});

var Testing = {
  setVar: function(key, value, textToDisplay) {
    var message = {
      action: "setTestingVar",
      key: key,
      value: value,
      text: textToDisplay || null
    };
    Logger.info("[b/testing.js] Sending (" + (textToDisplay || "") + ") " + key + " = " + value + " to c/testing.js");
    chrome.tabs.sendMessage(lastActiveTab.id, message, function (response) {
    });
  }
};
