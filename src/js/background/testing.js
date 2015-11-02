/*eslint no-unused-vars: 0 */
import Logger from "../debug/logger";
import Rules from "../global/rules";
import Utils from "../global/utils";
import JSONF from "../global/jsonf";
import Workflows from "../global/workflows";

var Testing = {
  setVar: function(key, value, textToDisplay) {
    var message = {
      action: "setTestingVar",
      key: key,
      value: value,
      text: textToDisplay || null
    };
    Logger.debug("[b/testing.js] Sending (" + (textToDisplay || "") + ") " + key + " = " + value + " to c/testing.js");
    if (window.lastActiveTab !== null) {
      chrome.tabs.sendMessage(window.lastActiveTab.id, message, function () {});
    }
  },
  appendTestLog: function(msg) {
    if (window.lastActiveTab !== null) {
      chrome.tabs.sendMessage(window.lastActiveTab.id, { action: "appendTestLog", value: msg}, function () {});
    }
  },
  // This method takes the otherwise inaccessable popup.html
  // and puts it into an <div> in the BG page
  // This process renders the popup (including all JS).
  // The popup then sends its rendered HTML to content.js
  // This is the only method to "click" and thereby view the popup HTML without
  // actually clicking on it.
  // Enables end to end testing because the browserAction cannot be clicked in tests.
  createCurrentPopupInIframe: function(tabId) {
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
    var rulesToImport = null;
    var tabSettingsToImport = null;

    // Import can be rules only or rules+workflows
    if(typeof parsed.rules !== "undefined" && typeof parsed.rules.rules !== "undefined") {
      rulesToImport = parsed.rules.rules;
      tabSettingsToImport = parsed.rules.tabSettings;
    } else {
      rulesToImport = parsed.rules;
      tabSettingsToImport = parsed.tabSettings;
    }

    // Save all tabs separatly
    rulesToImport.forEach(function (editorTabAndRules) {
      promises.push(Rules.save(editorTabAndRules.code, editorTabAndRules.tabId));
    });
    // save tabsetting
    promises.push(Storage.save(tabSettingsToImport, Utils.keys.tabs));

    // Save workflows?
    if(typeof parsed.workflows !== "undefined") {
      Workflows.save(parsed.workflows);
    }

    Promise.all(promises).then(function () {
      sendResponse(true);
    });
  }

  // Signal chrome that we plan to call the sendResponse() callback asynchronously
  // (See Promise.all above)
  // See https://developer.chrome.com/extensions/runtime#event-onMessage
  return true;
});

module.exports = Testing;
