/* global Utils, Logger, JSONF, Notification, Storage */
/* eslint no-unused-vars: 0 */
var FormUtil = {
  lastRule: null,
  applyRule: function(rule, lastActiveTab) {
    this.lastRule = rule;
    var message = null;
    var beforeData;

    // Open long standing connection to the tab containing the form to be worked on
    if(typeof lastActiveTab === "undefined") {
      Logger.info("[form_util.js] lastActivetab has gone away. Exiting.");
      return;
    }
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});

    port.postMessage({"action": "showWorkingOverlay"});

    var context = { url: Utils.parseUrl(lastActiveTab.url) };

    // Default instantaneous resolving promise:
    var beforeFunction = function() {
      return new Promise(function(resolve) {
        resolve(null);
      });
    };

    Logger.info("[form_utils.js] Applying rule " + JSONF.stringify(this.lastRule.name) + " (" + JSONF.stringify(this.lastRule.fields) + ") to tab " + lastActiveTab.id);

    var wrapInPromise = function(func) {
      return new Promise(function(resolve) {
        func(resolve, context);
      });
    };

    // Is there a 'before' block with an function or an array of functions?
    var beforeFunctions;
    if(typeof rule.before === "function") {
      beforeFunctions = [ wrapInPromise(rule.before) ];
    } else if(typeof rule.before === "object") {
      beforeFunctions = rule.before.map(function (func) {
        return wrapInPromise(func);
      });
    }

    if(typeof beforeFunctions !== "undefined") {
      Logger.info("[form_util.js] set 'before' function to " + JSONF.stringify(beforeFunction));
    }

    // call either the default - instantaneously resolving Promise (default) or
    // the arrray of before functions defined in the rule.
    Promise.all(beforeFunctions).then(function(data) {
      beforeData = data;
      // beforeData is null when there is no before action defined in the rule definition
      if(beforeData !== null) {
        Logger.info("[form_util.js] Got before data: " + JSONF.stringify(beforeData));
      }

      // If there was only one rule
      // reduce data array to one element
      if(beforeData.length === 1) {
        beforeData = beforeData[0];
      }

      rule.fields.forEach(function (field) {
        message = {
          "action": "fillField",
          "selector": field.selector,
          "value": JSONF.stringify(field.value),
          "beforeData": beforeData
        };
        port.postMessage(message);
        Logger.info("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
      });

      // Get errors. Receiver is in content.js
      Logger.info("[form_util.js] Posted to content.js: 'getErrors'");
      port.postMessage({"action": "getErrors"});
    });

    port.onMessage.addListener(function (message) {
      // Make errors from content scripts available here
      if(message.action === "getErrors") {
        var errors = JSONF.parse(message.errors);
        Logger.info("[form_util.js] Received 'getErrors' with " + errors.length + " errors");
        if(errors.length > 0) {
          Notification.create("There were " + errors.length + " errors while filling this form. Click here to view them.", function() {
            // Save the errors to local storage
            Storage.save({
                "errors": errors,
                "rule": rule}, Utils.keys.errors).then(function () {
              // Open options and forward the messages to options.js
              Utils.openOptions();
            });
          });
        }
        port.postMessage({"action": "hideWorkingOverlay"});
      }
    });
  }
};
