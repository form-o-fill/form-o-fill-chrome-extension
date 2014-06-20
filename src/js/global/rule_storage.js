/*global Utils */
"use strict";
var RuleStorage = {
  key: "form_o_fill_rules",
  loadRules: function(keyToLoadFrom) {
    var ruleStorage = this;
    var key = keyToLoadFrom || ruleStorage.key;
    return new Promise(function (resolve) {
      chrome.storage.local.get(key, function (persistedData) {
        resolve(persistedData[key]);
      });
    });
  },
  saveRules: function (rulesCode, keyToSaveTo) {
    var ruleStorage = this;
    return new Promise(function (resolve, reject) {
      var value = {};
      var key = keyToSaveTo || ruleStorage.key;
      value[key] = rulesCode;
      chrome.storage.local.set(value, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("RuleStorage saved " + value[key]);
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  },
  deleteRule: function (key) {
  }
};

