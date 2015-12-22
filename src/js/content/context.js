/*eslint no-unused-vars: 0 */
import * as JSONF from "../global/jsonf";

// This is not the same context as in background.js
// Currently it only allows to read storage values set by bg.js but
// you can set value for all value functions to access
var context = {
  storage: {
    get: function(key) {
      var value = window.sessionStorage.getItem(key);
      if(typeof value !== "undefined") {
        return JSONF.parse(value);
      }
      return value;
    },
    set: function(key, value) {
      // set it in localstorage
      window.sessionStorage.setItem(key, JSONF.stringify(value));
    }
  }
};

module.exports = context;
