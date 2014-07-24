/* global Utils, Logger, JSONF, Notification, Storage */
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

    // Default instantaneous resolving promise:
    var beforeFunction = function() {
      return new Promise(function(resolve) {
        resolve(null);
      });
    };

    Logger.info("[form_utils.js] Applying rule " + JSONF.stringify(this.lastRule.name) + " (" + JSONF.stringify(this.lastRule.fields) + ") to tab " + lastActiveTab.id);

    // Is there a 'before' block?
    if(typeof rule.before === "function") {
      // Wrap the function into a promise
      beforeFunction = function() {
        return new Promise(function(resolve) {
          rule.before(resolve);
        });
      };
      Logger.info("[form_util.js] set 'before' function to " + JSONF.stringify(beforeFunction));
    }

    // call either the default - instantaneously resolving Promise (default) or
    // the before function defined in the rule.
    beforeFunction().then(function(data) {
      beforeData = data;
      // beforeData is null when there is no before action defined in the rule definition
      if(beforeData !== null) {
        Logger.info("[form_util.js] Got before data: " + JSONF.stringify(beforeData));
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
