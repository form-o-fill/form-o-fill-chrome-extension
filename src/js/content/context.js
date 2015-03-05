/*eslint no-unused-vars: 0 */
// This is not the same context as in background.js
// Currently it only allows to read storage values set by bg.js
var context = {
  storage: {
    get: function(key) {
      return window.sessionStorage.getItem(key);
    }
  }
};
