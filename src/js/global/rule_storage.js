/*global Utils */
"use strict";
var RuleStorage = {
  loadRules: function(keyToLoadFrom) {
    var key = keyToLoadFrom || Utils.keys.rules;
    return new Promise(function (resolve) {
      chrome.storage.local.get(key, function (persistedData) {
        resolve(persistedData[key]);
      });
    });
  },
  saveRules: function (rulesCode, keyToSaveTo) {
    return new Promise(function (resolve, reject) {
      var value = {};
      var key = keyToSaveTo || Utils.keys.rules;
      value[key] = rulesCode;
      chrome.storage.local.set(value, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("[rule_storage.js] Saved '" + key + "' = " + value[key]);
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  },
  deleteRules: function (key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.remove(key, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("[rule_storage.js] Removed key '" + key + "'");
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  }
};

