/*global Logger jQuery Utils */
// This file is for end to end testing only
// It is delivered with the production code but disabled
var installTestingCode = function() {

  var Testing = {
    setTestingVar: function(key, value, text) {
      var $info = jQuery("#form-o-fill-testing-info");
      var foundEl = $info.find("." + key);
      // When the text property is set, append that to the DOM
      if(foundEl.length === 0 && typeof text !== "undefined") {
        $info.append("<tr><td>" + text + "</td><td class='" + key + "'>" + value + "</td></tr>");
      } else {
        $info.find("." + key).html(value);
      }
    }
  };

  // Tell the background page that we are in testing mode
  chrome.runtime.sendMessage({action: "setTestingMode", value: true}, function(bgInfo) {
    // The background page returns a lot of metadata about the extension
    // Display that in the testing page which has a special container for that
    // That information is then picked up by the integration tests to reach intern URLs like
    // the options page
    Logger.info("[c/testing.j] background.js has set testing mode to " + bgInfo.testingMode);
    Testing.setTestingVar("extension-id", bgInfo.extensionId, "Extension Id");
    Testing.setTestingVar("tab-id", bgInfo.tabId, "TabId of this page");
    Testing.setTestingVar("extension-version", bgInfo.extensionVersion, "Form-O-Fill Version");
    Testing.setTestingVar("testing-mode", bgInfo.testingMode, "Testing mode");
  });

  // Listen to messages from background.js
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Set a variable in the DOM based on what is sent from bg.js
    if(message.action === "setTestingVar" && message.key && typeof message.value !== "undefined") {
      Testing.setTestingVar(message.key, message.value, message.text);
      sendResponse(true);
    }
  });
};

// Enable only if we are running inside a special testing URL and are not bound to the live extension ID
if(!Utils.isLiveExtension() && /http:\/\/localhost:888[89]\/form-o-fill-testing\//.test(window.location.href)) {
  installTestingCode();
  Logger.info("[c/testing.js] Installed testing code in content page");
}
