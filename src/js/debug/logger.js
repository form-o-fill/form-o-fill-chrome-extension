"use strict";
var Logger = {
  info: function (msg, obj) {
    if (obj) {
      console.log("%s %O", msg, obj);
      return;
    }
    console.log("%O", msg);
  }
};
