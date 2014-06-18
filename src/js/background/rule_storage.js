/*global Utils, JSONF*/
"use strict";
var RuleStorage = {
  key: "form_o_fill_rules",
  loadRules: function() {
    var ruleStorage = this;
    return new Promise(function (resolve) {
      chrome.storage.local.get(ruleStorage.key, function (persistedData) {
        var rulesString = persistedData[ruleStorage.key];
        if(typeof rulesString === "string") {
          resolve(JSONF.parse(rulesString));
        }
        // No rules set so far, return empty set
        resolve([]);
      });
    });
  },
  saveRules: function (rulesJson) {
    var ruleStorage = this;
    return new Promise(function (resolve, reject) {
      var value = {};
      value[ruleStorage.key] = JSONF.stringify(rulesJson);
      chrome.storage.local.set(value, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("RuleStorage saved " + value[ruleStorage.key]);
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  }
};

