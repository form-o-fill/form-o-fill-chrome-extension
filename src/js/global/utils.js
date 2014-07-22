/*global jQuery */
var Utils = {
  // Set to false in BUILD:
  debug: true,
  keys: {
    extractedRule: "form-o-fill-extracted",
    rules: "form-o-fill-rules",
    errors: "form-o-fill-errors",
    tabs: "form-o-fill-tabs",
    logs: "form-o-fill-logs",
    lastMatchingRules: "form-o-fill-lastmatchingrules"
  },
  showExtractOverlay: function(whenFinishedCallback) {
    // Send message to content script
    chrome.runtime.sendMessage({"action": "lastActiveTabId"}, function(tabId) {
      var message = {
        "action": "showExtractOverlay"
      };
      chrome.tabs.sendMessage(tabId, message);
      whenFinishedCallback();
    });
  },
  openOptions: function(parameter) {
    var optionsUrl = chrome.runtime.getURL("html/options.html");
    if(parameter) {
      optionsUrl += parameter;
    }
    chrome.runtime.sendMessage({"action": "openIntern", "url": optionsUrl});
  },
  infoMsg: function(msg) {
    // A function to display a nice message in the rule editor
    var fadeAfterMSec = 1000;
    var $menuInfo = jQuery(".editor .menu .info");
    $menuInfo.html(msg).css({"opacity": "1"});
    setTimeout(function() {
      $menuInfo.animate({"opacity": 0}, 1000, function() {
        jQuery(this).html("");
      });
    }, fadeAfterMSec);
  }
};
