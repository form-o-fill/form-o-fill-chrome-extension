/* global Utils, JSONF, Errors, Notification */
var FormUtil = {
  applyRule: function(rule, lastActiveTab) {
    var message = null;
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});
    Utils.log("Applying rule " + JSONF.stringify(rule) + " to tab " + lastActiveTab.id);

    rule.fields.forEach(function (field) {
      message = {
        "action": "fillField",
        "selector": field.selector,
        "value": JSONF.stringify(field.value)
      };
      port.postMessage(message);
      Utils.log("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
    });

    // Get errors. receiver is in background.js
    Utils.log("[form_util.js] Posted to content.js: 'getErrors'");
    port.postMessage({"action": "getErrors"});

    port.onMessage.addListener(function (message) {
      // Make errors form content scripts available here
      if(message.action === "getErrors") {
        Utils.log("[firm_util.js] received 'getErrors'");
        if(message.errors.length > 0) {
          Notification.create("There were some errors when filling this form. Click here to view them.", function() {
            Utils.openOptions("#fillErrors");
          });
        }
      }
    });
  }
};
