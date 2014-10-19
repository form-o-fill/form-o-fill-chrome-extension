/*global Logger jQuery Utils */
// This file is for end to end testing only
// It is delivered with the production code but disabled
var installTestingCode = function() {
  var $info = jQuery("#form-o-fill-testing-info");

  // Tell the background page that we are in testing mode
  chrome.runtime.sendMessage({action: "setTestingMode", value: true}, function(bgInfo) {
    // The background page returns a lot of metadata about the extension
    // Display that in the testing page which has a special container for that
    // That information is then picked up by the integration tests to reach intern URLs like
    // the options page
    Logger.info("[c/testing.j] background.js has set testing mode to " + bgInfo.testingMode);
    $info.find(".extension-id").html(bgInfo.extensionId).end()
    .find(".tab-id").html(bgInfo.tabId).end()
    .find(".extension-version").html(bgInfo.extensionVersion).end()
    .find(".testing-mode").html(bgInfo.testingMode);
  });

  // Listen to messages from background.js
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {

    // Set a variable in the DOM based on what is sent from bg.js
    if(message.action === "setTestingVar" && message.key && typeof message.value !== "undefined") {
      var foundEl = $info.find("." + message.key);
      // When the text property is set, append that to the DOM
      if(foundEl.length === 0 && typeof message.text !== "undefined") {
        $info.append("<tr><td>" + message.text + "</td><td class='" + message.key + "'>" + message.value + "</td></tr>");
      } else {
        $info.find("." + message.key).html(message.value);
      }
      sendResponse(true);
    }
  });
};

// Enable only if we are running inside a special testing URL and are not bound to the live extension ID
if(!Utils.isLiveExtension() && window.location.href === "http://localhost:8888/form-o-fill-testing/") {
  installTestingCode();
  Logger.info("[c/testing.js] Installed testing code in content page");
}
