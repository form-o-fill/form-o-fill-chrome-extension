/* global Utils, JSONF, Notification, RuleStorage */
var FormUtil = {
  lastRule: null,
  applyRule: function(rule, lastActiveTab) {
    this.lastRule = rule;
    var message = null;
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});
    Utils.log("Applying rule " + JSONF.stringify(this.lastRule) + " to tab " + lastActiveTab.id);

    rule.fields.forEach(function (field) {
      message = {
        "action": "fillField",
        "selector": field.selector,
        "value": JSONF.stringify(field.value)
      };
      port.postMessage(message);
      Utils.log("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
    });

    // Get errors. Receiver is in content.js
    Utils.log("[form_util.js] Posted to content.js: 'getErrors'");
    port.postMessage({"action": "getErrors"});

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
