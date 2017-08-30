/*global jQuery Logger*/
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
    lastMatchingRules: "form-o-fill-lastmatchingrules",
    workflows: "form-o-fill-workflows",
    lastMatchingWorkflows: "form-o-fill-lastmatchingworkflows",
    runningWorkflow: "form-o-fill-runningworkflow",
    sessionStorage: "form-o-fill-sessionStorage",
    tutorialDataBackup: "form-o-fill-tutorialDataBackup",
    tutorialActive: "form-o-fill-tut-active",
    settings: "form-o-fill-settings",
    shadowStorage: "form-o-fill-shadow-storage",
    usageReport: "form-o-fill-usage-report"
  },
  defaultSettings: {
    alwaysShowPopup: false,
    jpegQuality: 60,
    reevalRules: false,
    matchOnLoad: false,
    dontMatchOnTabSwitch: false,
    importActive: false,
    importUrl: "",
    dontFireEvents: false
  },
  tabIdForShadow: 900,
  reevalRulesInterval: 2000,
  reservedLibNamespaces: ["h", "halt"],
  vendoredLibs: {
    "vendor/math.js/math.min.js": { detectWith: /Libs\.math/, name: "math", onWindowName: "math" },
    "vendor/chance.js/chance.js": { detectWith: /Libs\.chance/, name: "chance", onWindowName: "chance" },
    "vendor/moment.js/moment-with-locales.min.js": { detectWith: /Libs\.moment/, name: "moment", onWindowName: "moment" }
  },
  alarmIntervalInMinutes: 1,
  notificationTimeoutMs: 3000,
  alarmName: "FormOFillRemoteURLImportAlarm",
  defaultRule: 'var rules = [{\n' +
    '  "name": "The default rule",\n' +
    '  "url": "https://form-o-fill.github.io/tutorial/tour-1.html",\n' +
    '  "fields": [{\n' +
    '    "selector": "input[type=text]",\n' +
    '    "value": "Welcome!"\n' +
    '  }]\n' +
    '}\n' +
    '];',
  usageReportEndpoint: "https://script.google.com/macros/s/AKfycby3DJt1KiGPQlzdfLhNws2sGhrpP1zFG1AF_7xddZsKMbhH6yd0/exec",
  isLiveExtension: function() {
    return window.location.host === Utils.liveExtensionId;
  },
  onFormOFillSite: function() {
    /*eslint-disable no-extra-parens*/
    return window.location.host === "form-o-fill.github.io" || (window.location.host === "localhost" && window.location.port === "4000");
    /*eslint-enable no-extra-parens*/
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
    // Use the new API (>= 42) if possible
    // This hopefully fixes a bug where some notification click events won't fire
    if ("openOptionsPage" in chrome.runtime && typeof parameter === "undefined") {
      chrome.runtime.openOptionsPage();
    } else {
      // Old API
      var optionsUrl = chrome.runtime.getURL("html/options.html");
      if (parameter && parameter[0] === "#") {
        optionsUrl += parameter;
      }
      chrome.runtime.sendMessage({"action": "openIntern", "url": optionsUrl});
    }
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
  downloadImage: function(base64, filename) {
    var a = document.createElement("a");
    a.download = filename;
    a.href = base64;
    document.querySelector("body").appendChild(a);
    a.click();
    document.querySelector("body").removeChild(a);
    // REMOVE START
    if (typeof Logger !== "undefined") {
      Logger.info("[utils.js] Downloading image '" + filename + "'");
    }
    // REMOVE END
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
  },
  isBgPage: function() {
    if (typeof chrome.extension === "undefined" || typeof chrome.extension.getBackgroundPage === "undefined") {
      return false;
    }
    return true;
  }
};

// REMOVE START
if (typeof exports === "object") {
  module.exports = Utils;
}
// REMOVE END
