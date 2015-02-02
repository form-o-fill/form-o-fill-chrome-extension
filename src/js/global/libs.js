/*global Logger, I18n, Rules*/
// This creates a "safe" namespace for all libs
var Libs = {
  _libs: {},
  add: function(libraryName, librayTopLevelFunction, forceAdd) {
    // Check if the method is already defined
    forceAdd = forceAdd || false;
    if((this._libs[libraryName] || this.hasOwnProperty(libraryName)) && !forceAdd) {
      Logger.info("[libs.js] Can not add library named '" + libraryName + "' because it already exists as a function().");
      return;
    }
    this[libraryName] = librayTopLevelFunction;
    Logger.info("[libs.js] Added library as Libs." + libraryName);
  },
  import: function() {
    Rules.all().then(function (rules) {
      rules.forEach(function (rule) {
        if (typeof rule.export !== "undefined" && typeof rule.lib === "function") {
          // Add the rule into the scope of all library functions
          Libs.add(rule.export, rule.lib, true);
        }
      });
    });
  }
};

// helper for use in value functions
var valueFunctionHelper = {
  click: function($domNode) {
    $domNode.click();
  }
};
Libs.add("h", valueFunctionHelper);

// Process control functions
var processFunctionsHalt = function(msg) {
  return function() {
    if(typeof msg === "undefined") {
      msg = "Canceled by Libs.halt";
    }
    // TODO: call "showMessage"
    return null;
  };
};
Libs.add("halt", processFunctionsHalt);

// Add vendored chance.js
if(typeof window.Chance === "function") {
  Libs.add("chance", new window.Chance());
  window.chance = null;
}

// Add vendored moment.js and set locale
if(typeof window.moment === "function") {
  Libs.add("moment", window.moment);
  Libs.moment.lang(I18n.userLocale());
  window.moment = null;
}

// Import all saved libs
Libs.import();
