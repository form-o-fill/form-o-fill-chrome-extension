import * as Utils from "./utils";
import * as JSONF from "./jsonf";
import * as Logger from "../debug/logger";

var Storage = {
  load: function(keyToLoadFrom) {
    var key = keyToLoadFrom || Utils.keys.rules;
    return new Promise(function storageLoad(resolve) {
      chrome.storage.local.get(key, function prStorageLoad(persistedData) {
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
      chrome.storage.local.set(value, function storageSave() {
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
      chrome.storage.local.remove(key, function storageDelete() {
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

module.exports = Storage;
