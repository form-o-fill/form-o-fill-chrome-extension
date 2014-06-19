/*global Utils */
"use strict";
var RuleStorage = {
  key: "form_o_fill_rules",
  loadRules: function() {
    var ruleStorage = this;
    return new Promise(function (resolve) {
      chrome.storage.local.get(ruleStorage.key, function (persistedData) {
        resolve(persistedData[ruleStorage.key]);
      });
    });
  },
  saveRules: function (rulesCode) {
    var ruleStorage = this;
    return new Promise(function (resolve, reject) {
      var value = {};
      value[ruleStorage.key] = rulesCode;
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

