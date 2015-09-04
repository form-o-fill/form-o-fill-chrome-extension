/*global Logger Rules lastActiveTab */
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
    return new Promise(function (resolve) {
      Rules.all().then(function (rules) {
        rules.forEach(function (rule) {
          if (typeof rule.export !== "undefined" && typeof rule.lib === "function") {
            // Add the rule into the scope of all library functions
            Libs.add(rule.export, rule.lib, true);
          }
        });
      }).then(resolve("libraries imported"));
    });
  }
};

// helper for use in value functions
//
// "value" : Libs.h.click                                               => Clicks on the element specified by 'selector'
// "value" : Libs.h.ifEmpty("hello")                                    => Fills the field only if empty with the value
// "value" : Lib.g.ifEmpty(function($e, data) { return "some value"; }) => Executes the function only if the field is empty
var valueFunctionHelper = {
  click: function($domNode) {
    $domNode.click();
  },
  ifEmpty: function(value) {
    /*eslint-disable no-new-func*/
    if(typeof value === "function") {
      return value;
    }
    var preparedValue = value.replace(/'/g, "\\\'");
    var emptyFunc = new Function("$e", "data", "return ($e && typeof $e.val === \"function\" && $e.val() === '') ? '" + preparedValue + "' : null;");
    /*eslint-enable no-new-func*/

    return emptyFunc;
  }
};
Libs.add("h", valueFunctionHelper);

// Process control functions
var processFunctionsHalt = function(msg) {
  return function() {
    if(typeof lastActiveTab === "undefined") {
      return null;
    }

    if(typeof msg === "undefined") {
      msg = "Canceled by call to Libs.halt()";
    }

    // Since this is called from the b/form_utils.js
    // we need to send a message to the content.js
    chrome.tabs.sendMessage(lastActiveTab.id, {action: "showOverlay", message: msg});

    return null;
  };
};
Libs.add("halt", processFunctionsHalt);

// Import all saved libs
Libs.import();
