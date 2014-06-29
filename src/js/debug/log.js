"use strict";
var Log = {
  log: function (msg, obj) {
    if (obj) {
      console.log("[Form-O-Fill] %s %O", msg, obj);
      return;
    }
    console.log("[Form-O-Fill] %O", msg);
  }
};
