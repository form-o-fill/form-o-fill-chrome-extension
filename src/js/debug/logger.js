/*global Utils Testing */
/* eslint no-unused-vars: 0 */
var Logger = {
  out: function (level, msg, obj) {
    // Port to background.js
    var port = chrome.runtime.connect();
    port.postMessage({
      "action": "log",
      "message": msg
    });

    // REMOVE START
    if (typeof Testing !== "undefined") {
      // Takes too much of a performance hit
      //Testing.appendTestLog(msg);
    }
    // REMOVE END

    if (obj) {
      console[level]("[*FOF*]%s %O", msg, obj);
      return;
    }
    console[level]("[*FOF*]%s", msg);
  },
  info: function(msg, obj) {
    this.out("info", msg, obj);
  },
  debug: function(msg, obj) {
    this.out("debug", msg, obj);
  },
  warn: function(msg, obj) {
    this.out("warn", msg, obj);
  },
  error: function(msg, obj) {
    this.out("error", msg, obj);
  },
  delete: function() {
    chrome.storage.local.remove(Utils.keys.logs);
  },
  load: function() {
    return new Promise(function (resolve) {
      chrome.storage.local.get(Utils.keys.logs, function (storage) {
        if (typeof storage[Utils.keys.logs] === "undefined") {
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

      if (parts !== null) {
        entries.push({
          "createdAt": new Date().toLocaleString(),
          "location": parts[1].trim(),
          "message": msg
        });
      }

      var a = {};
      a[Utils.keys.logs] = entries;
      chrome.storage.local.set(a);
    });
  }
};


