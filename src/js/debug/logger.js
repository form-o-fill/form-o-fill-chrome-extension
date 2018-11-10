var Logger = {
  storageKey: "form-o-fill-logs",
  out: function(level, msg, obj) {
    // Port to background.js
    var port = chrome.runtime.connect();
    port.postMessage({
      action: "log",
      message: msg,
    });

    if (typeof msg !== "undefined" && typeof obj !== "undefined") {
      console[level]("[*FOF*] %s %O", msg, obj);
      return;
    }

    if (typeof msg !== "undefined") {
      console[level]("[*FOF*] %s", msg);
    }
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
    chrome.storage.local.remove(Logger.storageKey);
  },
  load: function() {
    return new Promise(function(resolve) {
      chrome.storage.local.get(Logger.storageKey, function(storage) {
        if (typeof storage[Logger.storageKey] === "undefined") {
          resolve([]);
          return;
        }
        resolve(storage[Logger.storageKey]);
      });
    });
  },
  _dateOptions: function() {
    return {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    };
  },
  store: function(msg) {
    this.load().then(function(entries) {
      var parts = msg.match(/\[(.*?)\](.*)/);

      entries = entries.slice(-25);

      if (parts !== null) {
        entries.push({
          createdAt: new Date().toLocaleString(),
          location: parts[1].trim(),
          message: msg,
        });
      }

      var a = {};
      a[Logger.storageKey] = entries;
      chrome.storage.local.set(a);
    });
  },
};
