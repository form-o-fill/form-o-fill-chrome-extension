/*global Log, I18n*/
// This creates a "safe" namespace for all libs
var Libs = {
  _libs: {},
  add: function(libraryName, librayTopLevelFunction) {
    // Check if the method is already defined
    if(this._libs[libraryName] || this.hasOwnProperty(libraryName)) {
      Log.log("[libs.js] Can not add library named '" + libraryName + "' because it already exists as a function().");
      return;
    }
    this[libraryName] = librayTopLevelFunction;
    Log.log("[libs.js] Added library as Libs." + libraryName);
  }
};

// Add vendored chance.js
Libs.add("chance", new window.Chance());
window.chance = null;

// Add vendored moment.js and set locale
Libs.add("moment", window.moment);
Libs.moment.lang(I18n.userLocale());
window.moment = null;
