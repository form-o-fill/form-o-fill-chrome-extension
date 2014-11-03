/*eslint no-unused-vars: [2, "Testing"] */
/*global Logger Utils lastActiveTab JSONF Rules Storage */

var Testing = {
  setVar: function(key, value, textToDisplay) {
    var message = {
      action: "setTestingVar",
      key: key,
      value: value,
      text: textToDisplay || null
    };
    Logger.debug("[b/testing.js] Sending (" + (textToDisplay || "") + ") " + key + " = " + value + " to c/testing.js");
    chrome.tabs.sendMessage(lastActiveTab.id, message, function () {});
  }
};

// Listener for messages from content.js -> testing.js
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

  // Activate testing mode
  // Sends extension infos back to content/testing.js
  if (message.action === "setTestingMode") {
    /*eslint-disable no-undef, block-scoped-var*/
    testingMode = message.value;
    /*eslint-enable no-undef, block-scoped-var*/

    // useful info to display in the testing page
    Rules.all().then(function (rules) {

      var ruleCount = rules.filter(function (rule) {
        return typeof rule.name !== "undefined" && typeof rule.fields !== "undefined";
      }).length;

      var info = {
        testingMode: message.value,
        extensionId: sender.id,
        extensionVersion: Utils.version,
        tabId: sender.tab.id,
        ruleCount: ruleCount,
        libCount: rules.length - ruleCount
      };
      Logger.debug("[b/testing.js] Set testingMode to " + message.value);

      sendResponse(info);
    });
  }

  // Import Rules
  // Sends importInfo back to content/testing.js
  if(message.action === "importRules") {
    var parsed = JSONF.parse(message.value);
    var promises = [];

    // Save all tabs separatly
    parsed.rules.forEach(function (editorTabAndRules) {
      promises.push(Rules.save(editorTabAndRules.code, editorTabAndRules.tabId));
    });
    // save tabsetting
    promises.push(Storage.save(parsed.tabSettings, Utils.keys.tabs));

    Promise.all(promises).then(function () {
      sendResponse(true);
    });
  }

  // Signal chrome that we plan to call the sendResponse() callback asynchronously
  // (See Promise.all above)
  // See https://developer.chrome.com/extensions/runtime#event-onMessage
  return true;
});

// This method takes the otherwise inaccessable popup.html
// and puts it into an iframe in the BG page
// This process renders the popup (including all JS).
// The popup then sends its rendered HTML to content.js
// This is the only method to "click" and thereby view the popup HTML without
// actually clicking on it.
// Enables end to end testing because the browserAction cannot be clicked in tests.
var createCurrentPopupInIframe = function(tabId) {
  chrome.browserAction.getPopup({"tabId": tabId}, function (popupUrl) {
    var iframePopup = document.querySelector("#form-o-fill-popup-iframe");
    if (iframePopup) {
      iframePopup.src = popupUrl;
    } else {
      iframePopup = document.createElement("iframe");
      iframePopup.id = "form-o-fill-popup-iframe";
      iframePopup.src = popupUrl;
      document.querySelector("body").appendChild(iframePopup);
    }
  });
};

