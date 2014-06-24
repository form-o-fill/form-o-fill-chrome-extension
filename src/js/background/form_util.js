/* global Utils, JSONF, Notification */
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

    // Get errors. receiver is in content.js
    Utils.log("[form_util.js] Posted to content.js: 'getErrors'");
    port.postMessage({"action": "getErrors"});

    port.onMessage.addListener(function (message) {
      // Make errors form content scripts available here
      if(message.action === "getErrors") {
        var errors = JSONF.parse(message.errors);
        Utils.log("[form_util.js] Received 'getErrors' with " + errors.length + " errors");
        if(errors.length > 0) {
          Notification.create("There were " + errors.length + " errors while filling this form. Click here to view them.", function() {
            // Forward the messages to options.js
            Utils.openOptions();
            chrome.runtime.sendMessage({
              "action": "showFillErrors",
              "errors": message.errors,
              "rule": {
                "name": rule.name,
                "url": rule.url.toString()
              }
            });
          });
        }
      }
    });
  }
};
