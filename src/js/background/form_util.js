/* global Utils, JSONF, Notification, RuleStorage */
var FormUtil = {
  lastRule: null,
  applyRule: function(rule, lastActiveTab) {
    this.lastRule = rule;
    var message = null;
    var beforeData;

    // Open long standing connection to the tab containing the form to be worked on
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});

    // Default instantaneous resolving promise:
    var beforeFunction = new Promise(function(resolve) {
      resolve(null);
    });

    Utils.log("Applying rule " + JSONF.stringify(this.lastRule) + " to tab " + lastActiveTab.id);

    // Is there a 'before' block?
    if(typeof rule.before === "function") {
      // Wrap the function into an Promise
      // check for Promise and resolve(...); first
      beforeFunction = rule.before;
      Utils.log("[form_util.js] set 'before' function to " + JSONF.stringify(beforeFunction));
    }

    // call either the default - instantaneously resolving Promise (default) or
    // the before function defined in the rule.
    beforeFunction().then(function(data) {
      beforeData = data;
      Utils.log("[form_util.js] Got before data: " + JSONF.stringify(beforeData));

      rule.fields.forEach(function (field) {
        message = {
          "action": "fillField",
          "selector": field.selector,
          "value": JSONF.stringify(field.value),
          "beforeData": beforeData
        };
        port.postMessage(message);
        Utils.log("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
      });

      // Get errors. Receiver is in content.js
      // TODO: Not sure if the getErrors call can occur BEFORE all fillField calls have been accomplished?!
      Utils.log("[form_util.js] Posted to content.js: 'getErrors'");
      port.postMessage({"action": "getErrors"});
    });

    port.onMessage.addListener(function (message) {
      // Make errors from content scripts available here
      if(message.action === "getErrors") {
        var errors = JSONF.parse(message.errors);
        Utils.log("[form_util.js] Received 'getErrors' with " + errors.length + " errors");
        if(errors.length > 0) {
          Notification.create("There were " + errors.length + " errors while filling this form. Click here to view them.", function() {
            // Save the errors to local storage
            RuleStorage.saveRules({
                "errors": errors,
                "rule": rule}, Utils.keys.errors).then(function () {
              // Open options and forward the messages to options.js
              Utils.openOptions();
            });
          });
        }
      }
    });
  }
};
