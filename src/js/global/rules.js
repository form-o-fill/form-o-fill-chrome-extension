/*global Storage, Logger, jQuery, js_beautify, Utils, JSONF */
/*eslint no-new-func:0, max-nested-callbacks:[1,4], complexity: 0*/
"use strict";

/* A single Rule */
var Rule = function() {
  this.prettyPrint = function() {
    var clone = jQuery.extend({}, this);
    delete clone.matcher;
    delete clone.nameClean;
    delete clone.urlClean;
    delete clone.id;
    delete clone._escapeForRegexp;
    return JSON.stringify(clone, null, 2);
  };

  this.prettyPrintHtml = function() {
    return this.prettyPrint().replace(/\n/,"<br />");
  };

  this._escapeForRegexp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
};

Rule.create = function(options, tabId, ruleIndex) {
  delete options.matcher;
  delete options.nameClean;
  delete options.urlClean;
  delete options._escapeForRegexp;
  delete options.prettyPrint;
  delete options.prettyPrintHtml;
  var rule = new Rule();
  Object.keys(options).forEach(function(key) {
    rule[key] = options[key];
  });

  // RegExp in URL or string?
  if(typeof rule.url !== "undefined" && typeof rule.url.test !== "undefined") {
    // RegExp
    rule.matcher = new RegExp(rule.url);
  } else if(typeof rule.url !== "undefined") {
    // String (match full url only)
    rule.matcher = new RegExp("^" + rule._escapeForRegexp(rule.url) + "$");
  }

  if (typeof rule.url !== "undefined") {
    rule.urlClean = rule.url.toString();
  } else {
    rule.urlClean = "n/a";
  }
  rule.nameClean = rule.name.replace("<", "&lt;");
  if(typeof rule.id === "undefined") {
    rule.id = tabId + "-" + ruleIndex;
  }
  Logger.info("[rule.js] created rule", rule);
  return rule;
};

/* Multiple Rules */
var Rules = {
  ruleCount: 0,
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
  load: function(forTabId) {
    var that = this;
    return new Promise(function (resolve) {
      Storage.load(that._nameForTabId(forTabId)).then(function (rulesData) {
        var rules = [];
        if(rulesData) {
          var ruleFunction = that.text2function(rulesData.code);

          if(ruleFunction === null) {
            resolve(rules);
          }

          that.ruleCount = 0;

          rules = ruleFunction.map(function (ruleJson, index) {
            that.ruleCount += 1;
            return Rule.create(ruleJson, forTabId, index);
          });
        }
        resolve(rules);
      });
    });
  },
  text2function: function(codeText) {
    // remove wrapper
    // results in [ code ... code ]
    var rulesCodeMatches = codeText.match(/^.*?(\[[\s\S]*\];)$/m);

    if(!rulesCodeMatches[1]) {
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
    if(!/^var\s+?([a-z_])+\s+=\s+\[/i.test(editor.session().getLine(0)) ||
       !/^\s*\];\s*$/.test(editor.session().getLine(editor.session().getLength() - 1))) {
      errors.push("var-needed");
    }

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

