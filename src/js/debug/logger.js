/*global Storage, Utils */
"use strict";
var Logger = {
  info: function (msg, obj) {
    // TODO: open port here!
    if(typeof obj !== "undefined" && typeof obj.sender !== "undefined") {
      // A port object. So we communicate with bg.js
      obj.postMessage({"action": "log", "message": msg});
      return;
    }

    if (obj) {
      console.log("%s %O", msg, obj);
      return;
    }
    console.log("%O", msg);
    if(Utils.debug) {
      this.store(msg);
    }
  },
  delete: function() {
    chrome.storage.local.remove(Utils.keys.logs);
  },
  load: function() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(Utils.keys.logs, function (storage) {
        if(typeof storage[Utils.keys.logs] === "undefined") {
          resolve([]);
          return;
        }
        resolve(storage[Utils.keys.logs]);
      });
    });
  },
  _dateOptions: function() {
    return {year: "numeric", month: "numeric", day: "numeric",
           hour: "numeric", minute: "numeric", second: "numeric",
           hour12: false};
  },
  store: function(msg) {
    this.load().then(function (entries) {
      var parts = msg.match(/\[(.*?)\](.*)/);

      entries = entries.slice(-25);

      if(parts !== null) {
        entries.push({
          "createdAt": new Date().toLocaleString(),
          "location": parts[1].trim(),
          "message": parts[2].trim()
        });
      }

      var a = {};
      a[Utils.keys.logs] = entries;
      chrome.storage.local.set(a);
    });
  }
};


