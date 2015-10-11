/*global Logger jQuery Utils showExtractOverlay */
// This file is for end to end testing only
// It is delivered with the production code but disabled
var installTestingCode = function() {

  var shouldLog = !jQuery("body").hasClass("test-no-log");

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
    },
    appendTestLog: function(msg) {
      if(shouldLog) {
        jQuery("td.log ul").append("<li>" + msg + "</li>");
      }
    }
  };

  // Tell the background page that we are in testing mode
  chrome.runtime.sendMessage({action: "setTestingMode", value: true}, function(bgInfo) {
    // The background page returns a lot of metadata about the extension
    // Display that in the testing page which has a special container for that.
    // That information is then picked up by the integration tests to reach intern URLs like
    // the options page
    Logger.info("[c/testing.j] background.js has set testing mode to " + bgInfo.testingMode);
    Testing.setTestingVar("extension-id", bgInfo.extensionId, "Extension Id");
    Testing.setTestingVar("extension-options-url", "<a target='_self' href='chrome-extension://" + bgInfo.extensionId + "/html/options.html'>chrome-extension://" + bgInfo.extensionId + "/html/options.html</a>", "Options URL");
    Testing.setTestingVar("tab-id", bgInfo.tabId, "TabId of this page");
    Testing.setTestingVar("extension-version", bgInfo.extensionVersion, "Form-O-Fill Version");
    Testing.setTestingVar("testing-mode", bgInfo.testingMode, "Testing mode");
    Testing.setTestingVar("rule-count", bgInfo.ruleCount, "Number of rules");
    Testing.setTestingVar("lib-count", bgInfo.libCount, "Number of library functions");
    Testing.setTestingVar("log", "<ul></ul>", "Log");
  });

  // Listen to messages from background.js
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Set a variable in the DOM based on what is sent from bg.js
    if(message.action === "setTestingVar" && message.key && typeof message.value !== "undefined") {
      Testing.setTestingVar(message.key, message.value, message.text);
      sendResponse(true);
    }

    if(message.action === "appendTestLog" && typeof message.value !== "undefined") {
      Testing.appendTestLog(message.value);
      sendResponse(true);
    }
  });

  //
  // Bind some handlers to make working with the testcases
  // easier
  jQuery(document).on("click", "#form-o-fill-testing-import-submit", function () {
    // Attach an listener to the <button> so that the rules that should be imported can be send
    // to the background/testing.js page
    var rulesCode = jQuery("#form-o-fill-testing-import").val();
    chrome.runtime.sendMessage({action: "importRules", value: rulesCode}, function () {
      window.location.reload();
    });
  }).on("click", ".popup-html li.select-rule", function() {
    // Clicks on the simulated popup should trigger filling
    var domNode = this;
    var data = jQuery(this).data();
    var message = {
      "action": "fillWithRule",
      "index": data.ruleIndex,
      "id": data.ruleId
    };
    chrome.extension.sendMessage(message, function() {
      Testing.setTestingVar("rule-filled-id", message.id, "Filled form with rule #id");
      Testing.setTestingVar("rule-filled-name", domNode.innerHTML, "Filled form with rule #name");
      domNode = null;
    });
  }).on("click", ".extension-options-url", function () {
    // Simulate a click on the testing options link
    Utils.openOptions();
  }).on("click", "a.cmd-show-extract-overlay", function () {
    // Execute extract form function
    showExtractOverlay();
  }).on("click", ".popup-html li.select-workflow", function() {
    // Clicks on the simulated popup should trigger workflow
    var domNode = this;
    var data = jQuery(this).data();
    var message = {
      "action": "fillWithWorkflow",
      "index": data.workflowIndex,
      "id": data.workflowId
    };
    chrome.extension.sendMessage(message, function() {
      Testing.setTestingVar("rule-filled-id", message.id, "Filled form with workflow #id");
      Testing.setTestingVar("rule-filled-name", domNode.innerHTML, "Filled form with workflow #name");
      domNode = null;
    });
  });

  // Make the Testn object available in dev
  if(!Utils.isLiveExtension()) {
    window.Testing = Testing;
  }
};

// Enable only if we are running inside a special testing URL and are not bound to the live extension ID
if(!Utils.isLiveExtension() && /http:\/\/localhost:9292\/form-o-fill-testing\//.test(window.location.href)) {
  installTestingCode();
  Logger.info("[c/testing.js] Installed testing code in content page");
}
