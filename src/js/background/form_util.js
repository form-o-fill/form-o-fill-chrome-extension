/* global Utils, JSONF */
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
      Utils.log("Posted to content.js: Fill " + field.selector + " with " + field.value);
    });
  }
};
