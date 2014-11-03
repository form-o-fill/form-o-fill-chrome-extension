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
    Logger.info("[b/testing.js] Sending (" + (textToDisplay || "") + ") " + key + " = " + value + " to c/testing.js");
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
      Logger.info("[b/testing.js] Set testingMode to " + message.value);

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

