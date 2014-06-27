/*global Utils */
"use strict";
var Storage = {
  load: function(keyToLoadFrom) {
    var key = keyToLoadFrom || Utils.keys.rules;
    return new Promise(function (resolve) {
      chrome.storage.local.get(key, function (persistedData) {
        resolve(persistedData[key]);
      });
    });
  },
  save: function (rulesCode, keyToSaveTo) {
    return new Promise(function (resolve, reject) {
      var value = {};
      var key = keyToSaveTo || Utils.keys.rules;
      value[key] = rulesCode;
      chrome.storage.local.set(value, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("[storage.js] Saved '" + key + "' = " + value[key]);
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  },
  delete: function (key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.remove(key, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Utils.log("[storage.js] Removed key '" + key + "'");
          resolve(true);
        } else {
          reject(Error(chrome.runtime.lastError));
        }
      });
    });
  }
};

