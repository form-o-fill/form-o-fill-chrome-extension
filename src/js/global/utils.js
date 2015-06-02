/*global jQuery */
/*eslint no-unused-vars: 0*/
var Utils = {
  // Will be set to false in BUILD:
  debug: true,
  version: "##VERSION##",
  liveExtensionId: "iebbppibdpjldhohknhgjoapijellonp",
  keys: {
    extractedRule: "form-o-fill-extracted",
    rules: "form-o-fill-rules",
    errors: "form-o-fill-errors",
    tabs: "form-o-fill-tabs",
    logs: "form-o-fill-logs",
    lastMatchingRules: "form-o-fill-lastmatchingrules",
    workflows: "form-o-fill-workflows",
    lastMatchingWorkflows: "form-o-fill-lastmatchingworkflows",
    runningWorkflow: "form-o-fill-runningworkflow",
    sessionStorage: "form-o-fill-sessionStorage",
    tutorialDataBackup: "form-o-fill-tutorialDataBackup",
    tutorialActive: "form-o-fill-tut-active"
  },
  reservedLibNamespaces: ["h", "halt"],
  vendoredLibs: {
    "vendor/chance.js/chance.js": { detectWith: /Libs\.chance/, name: "chance", onWindowName: "chance" },
    "vendor/moment.js/moment-with-langs.js": { detectWith: /Libs\.moment/, name: "moment", onWindowName: "moment" }
  },
  isLiveExtension: function() {
    return window.location.host === Utils.liveExtensionId;
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
    var $menuInfo = jQuery(".editor .menu .info, #workflows .info");
    $menuInfo.html(msg).css({"opacity": "1"});
    setTimeout(function() {
      $menuInfo.animate({"opacity": 0}, 1000, function() {
        jQuery(this).html("");
      });
    }, fadeAfterMSec);
  },
  download: function(data, filename, mimeType) {
    // Creates and triggers a download from a string
    var blob = new Blob([data], { type: mimeType});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.download = filename;
    a.href = url;
    document.querySelector("body").appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.querySelector("body").removeChild(a);
  },
  parseUrl: function(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return {
      url: url,
      protocol: parser.protocol,
      host: parser.hostname,
      port: parser.port,
      path: parser.pathname,
      query: parser.search,
      hash: parser.hash
    };
  },
  sortRules: function(unsortedRules) {
    return unsortedRules.sort(function (a, b) {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = Utils;
}
// REMOVE END
