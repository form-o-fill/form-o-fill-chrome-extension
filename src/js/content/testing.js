/*global Logger jQuery */
// This file is for end to end testing only
// It is delivered with the production code but disabled
var installTestingCode = function() {

  // Tell the background page that we are in testing mode
  var message = {
    action: "setTestingMode",
    value: true
  };

  chrome.runtime.sendMessage(message, function(bgInfo) {
    Logger.info("[c/testing.j] background.js has set testing mode to " + bgInfo.testingMode);
    var $info = jQuery("#form-o-fill-testing-info");
    $info.find(".extension-id").html(bgInfo.extensionId).end()
    .find(".tab-id").html(bgInfo.tabId).end()
    .find(".testing-mode").html(bgInfo.testingMode);
  });

  // Listen to messages from background.js
  chrome.runtime.onConnect.addListener(function (port) {

    if(port.name != "FormOFill") {
      return;
    }

  });
};

// Enable only if we are running inside a special testing URL
if(window.location.href === "http://localhost:8888/form-o-fill-testing/") {
  installTestingCode();
  Logger.info("[c/testing.js] Installed testing code in content page");
}
