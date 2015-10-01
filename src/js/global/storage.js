/*global Utils, Logger, JSONF */
/* eslint no-undef: 0, no-unused-vars: 0 */
var Storage = {
  load: function(keyToLoadFrom) {
    var key = keyToLoadFrom || Utils.keys.rules;
    return new Promise(function (resolve) {
      chrome.storage.local.get(key, function (persistedData) {
        Logger.debug("[storage.js] loaded '" + key + "'", JSONF.stringify(persistedData));
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
          Logger.debug("[storage.js] Saved '" + key + "'", JSONF.stringify(value[key]));
          resolve(true);
        } else {
          reject(new Error(chrome.runtime.lastError));
        }
      });
    });
  },
  delete: function (key) {
    return new Promise(function (resolve, reject) {
      chrome.storage.local.remove(key, function () {
        if(typeof chrome.runtime.lastError === "undefined") {
          Logger.debug("[storage.js] Removed key '" + key + "'");
          resolve(true);
        } else {
          reject(new Error(chrome.runtime.lastError));
        }
      });
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = Storage;
}
// REMOVE END
