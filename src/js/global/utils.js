"use strict";
var Utils = {
  keys: {
    extractedRule: "form-o-fill-extracted",
    rules: "form-o-fill-rules",
    errors: "form-o-fill-errors"
  },
  showExtractOverlay: function() {
    var message = {
      "action": "showExtractOverlay"
    };

    // Send message to content script
    chrome.tabs.query({"active": true, "lastFocusedWindow": true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  },
  openOptions: function(parameter) {
    var optionsUrl = chrome.runtime.getURL("html/options.html");
    if(parameter) {
      optionsUrl += parameter;
    }
    chrome.runtime.sendMessage({"action": "openIntern", "url": optionsUrl});
  },
  log: function (msg, obj) {
    if (obj) {
      console.log("[Form-O-Fill] %O %O", msg, obj);
      return;
    }
    console.log("[Form-O-Fill] %O", msg);
  }
};
