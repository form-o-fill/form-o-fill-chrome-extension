/*global Logger, js_beautify, JSONF, Rule */
/*eslint no-new-func:0, max-nested-callbacks:[1,4], complexity: 0*/

// REMOVE START
/*eslint-disable no-undef, block-scoped-var */
if(typeof exports === "object") {
  var Utils = require("./utils.js");
  var Storage = require("./storage.js");
  var Rule = require("./rule.js");
}
/*eslint-enable no-undef, block-scoped-var */
// REMOVE END

/* Multiple Rules */
var Rules = {
  match: function(url) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.all().then(function(rules) {
        var matchingRules = rules.filter(function (rule) {
          return typeof rule.url !== "undefined" && url.match(rule.url);
        });
        resolve(matchingRules);
      });
    });
  },
  load: function(forTabId, ruleIndex) {
    var that = this;
    return new Promise(function (resolve) {
      Storage.load(that._nameForTabId(forTabId)).then(function (rulesData) {
        var rules = [];
        if(rulesData) {
          var ruleFunction = that.text2function(rulesData.code);

          if(ruleFunction === null) {
            resolve(rules);
          }

          rules = ruleFunction.map(function (ruleJson, index) {
            return Rule.create(ruleJson, forTabId, index);
          });
        }

        if(typeof ruleIndex !== "undefined") {
          resolve(rules[ruleIndex - 1]);
        } else {
          resolve(rules);
        }
      });
    });
  },
  text2function: function(codeText) {
    // remove wrapper
    // results in [ code ... code ]
    var rulesCodeMatches = codeText.match(/^.*?(\[[\s\S]*\];)$/m);
    if(!rulesCodeMatches || !rulesCodeMatches[1]) {
      return false;
    }
    var ruleCode = "return " + rulesCodeMatches[1].replace(/\\n/g,"");
    return new Function(ruleCode)();
  },
  all: function() {
    return new Promise(function (resolve) {
      Logger.info("[rules.js] Fetching all rules");
      Storage.load(Utils.keys.tabs).then(function(tabSettings) {
        var promises = [];
        var rules = [];

        // Generate a Promise for all tab to be loaded
        tabSettings.forEach(function (tabSetting) {
          promises.push(Rules.load(tabSetting.id));
        });

        // Wait until resolved
        Promise.all(promises).then(function (values) {
          // Outer loop: An array of arrays of rules [[Rule, Rule], [Rule, Rule]]
          values.forEach(function (ruleSetForTab) {
            // Inner Loop: An array of rules [Rule, Rule]
            ruleSetForTab.forEach(function (ruleSet) {
              rules.push(ruleSet);
            });
          });
          Logger.info("[rules.js] Fetched " + rules.length + " rules");
          resolve(rules);
        });
      });
    });
  },
  save: function(ruleCode, activeTabId) {
    return new Promise(function (resolve) {
      var rulesData = {
        tabId: activeTabId,
        code: ruleCode
      };
      Storage.save(rulesData, Rules._nameForTabId(activeTabId)).then(function () {
        resolve(true);
      });
    });
  },
  delete: function(tabId) {
    Storage.delete(this._nameForTabId(tabId));
  },
  _nameForTabId: function(tabId) {
    return Utils.keys.rules + "-tab-" + tabId;
  },
  format: function(rulesCodeString) {
    // Prettify code a little
    var prettyCode = js_beautify(rulesCodeString, {
      "indent_size": 2,
      "indent_char": " ",
      "preserve_newlines": false,
      "brace_style": "collapse",
      "space_before_conditional": true,
      "keep_function_indentation": true,
      "unescape_strings": false
    });
    if(/\}\];$/.test(prettyCode)) {
      prettyCode = prettyCode.replace(/\}\];$/, "}\n];");
    }
    return prettyCode;
  },
  // Simple checks for the neccessary structure of the rules
  syntaxCheck: function(editor) {
    var that = this;
    var errors = [];

    // Check if there are some ACE Annotations (aka. errors) present
    var annotationCount =  editor.session().getAnnotations().length;
    if(annotationCount > 0) {
      errors.push("annotations-present");
    }

    // Check structure of rules code
    // BROKEN!
    //if(!/^var\s+?([a-z_])+\s+=\s+\[/i.test(editor.session().getLine(0)) ||
       //!/^\s*\];\s*$/.test(editor.session().getLine(editor.session().getLength() - 1))) {
      //errors.push("var-needed");
    //}

    // Check for before function structure
    if (errors.length == 0) {
      var ruleCodeCheck = this.text2function(editor.getValue());
      ruleCodeCheck.forEach(function (ruleFunction) {
        if(ruleFunction.hasOwnProperty("before")) {
          Logger.info("[rules.js] Found a before function in rule '" + ruleFunction.before.toString() + "'");
          that.checkBeforeFunction(ruleFunction.before, errors);
        }
      });
    }
    return errors;
  },
  checkBeforeFunction: function(ruleFunction, errors) {
    // Not a function!
    if(typeof ruleFunction !== "function") {
      errors.push("before-function-needs-to-be-a-function");
    }
    if(typeof ruleFunction === "function") {
      // Fetch the name of the first argument
      var resolveMatches = ruleFunction.toString().match(/function[\s]*\((.*?)[,\)]/);
      var resolveFunctionName = resolveMatches[1];

      if(resolveFunctionName === "") {
        errors.push("before-function-needs-resolve-argument");
      } else {
        // Look for usage of the first ergument (presumly "resolve") in the code
        var regex = "\\{[\\s\\S]*" + resolveFunctionName + "[\\s\\S]*\\}.*$";
        resolveMatches = ruleFunction.toString().match(regex);
        // No call to resolve?
        if(resolveMatches === null || (resolveMatches && !resolveMatches[0].match(resolveFunctionName + "\\s*\\(|\\(\\s*" + resolveFunctionName + "\\s*\\)"))) {
          errors.push("before-function-needs-resolve-call");
        }
      }
    }
  },
  lastMatchingRules: function(rules) {
    return new Promise(function (resolve) {
      // Load or save rules
      if(typeof rules === "undefined") {
        Storage.load(Utils.keys.lastMatchingRules).then(function (serializedRules) {
          resolve(JSONF.parse(serializedRules));
        });
      } else {
        Storage.save(JSONF.stringify(rules), Utils.keys.lastMatchingRules).then(function () {
          resolve(true);
        });
      }
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = Rules;
}
// REMOVE END
