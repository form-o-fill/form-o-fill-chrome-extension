/*eslint no-new-func:0, max-nested-callbacks:[1,4], complexity: 0, block-scoped-var: 0*/
import Logger from "../debug/logger";
import JSONF from "../global/jsonf";

// REMOVE START
/*eslint-disable no-undef, block-scoped-var */
if(typeof exports === "object") {
  var Utils = require("./utils.js");
  var Storage = require("./storage.js");
  var Rule = require("./rule.js");
  /*eslint-disable camelcase*/
  var js_beautify = function(code) {
    return code;
  };
  /*eslint-enable camelcase*/
}
/*eslint-enable no-undef, block-scoped-var */
// REMOVE END

/* Multiple Rules */
var Rules = {
  match: function(target) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.all().then(function(rulez) {
        var matchingRules = rulez.filter(function (rule) {
          return typeof rule.url !== "undefined" && target.match(rule.url);
        });
        resolve(matchingRules);
      });
    });
  },
  findByName: function(target) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.all().then(function(rulez) {
        var matchingRules = rulez.filter(function (rule) {
          return typeof rule.name !== "undefined" && target === rule.name;
        });
        resolve(matchingRules[0]);
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
    var ruleCode = "return " + rulesCodeMatches[1];
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
    var lineCount = editor._document.getLength();
    var lineStart = editor._document.getLine(0);
    var lineEnd = editor._document.getLine(lineCount - 1);

    // Detect if the first line does not correctly containing "var rules = ["
    if(lineStart.match(/var\s+\w+\s*=\s*\[/) === null) {
      errors.push("need-var-rules");
    }

    // Do the rules end with ] ?
    if(lineEnd.match(/][;]?\s*$/) === null) {
      errors.push("need-var-rules");
    }

    // Check if there are some ACE Annotations (aka. errors) present
    var annotationCount = editor.session().getAnnotations().length;
    if(annotationCount > 0) {
      errors.push("annotations-present");
    }

    // Check used library function definitions, must not contain reserved
    // library namespaces
    var libMatches = editor.getValue().match(/export["']?\s*:\s*['"].*?['"]/g);
    if(libMatches !== null) {
      // There are library definitions
      var foundReservedNs = libMatches.map(function (matchStr) {
        return matchStr.match(/:\s*['"](.*?)['"]/)[1];
      }).filter(function (matchStr) {
        return Utils.reservedLibNamespaces.indexOf(matchStr) !== -1;
      });

      if(foundReservedNs.length > 0) {
        errors.push({id: "libs-using-reserved-namespaces", extra: foundReservedNs});
      }
    }

    if (errors.length === 0) {
      // Check for before/after function structure
      var ruleCodeCheck = this.text2function(editor.getValue());

      ruleCodeCheck.forEach(function (ruleFunction) {
        if(ruleFunction.hasOwnProperty("before")) {
          Logger.info("[rules.js] Found a before function in rule '" + ruleFunction.before.toString() + "'");
          that.checkSurroundFunction(ruleFunction.before, errors);
        }
        if(ruleFunction.hasOwnProperty("after")) {
          Logger.info("[rules.js] Found a after function in rule '" + ruleFunction.after.toString() + "'");
          that.checkSurroundFunction(ruleFunction.after, errors);
        }
      });

    }
    return errors;
  },
  checkSurroundFunction: function(ruleFunction, errors) {
    // before/after function can be either a function or an array of functions
    // Not a function or an array of functions
    if(typeof ruleFunction !== "function" && typeof ruleFunction.length === "undefined") {
      errors.push("before-function-needs-to-be-a-function-or-array");
    }

    // Create an array to make checking easier
    if(typeof ruleFunction === "function") {
      ruleFunction = [ ruleFunction ];
    }

    var ruleFuncErrors = {
      needResolveArg: false,
      needResolveCall: false,
      needFunctions: false
    };

    // Used an array? Check for t least one rule
    if(ruleFunction.length === 0) {
      ruleFuncErrors.needFunctions = true;
    }

    // If it is a function check if it uses resolve()
    ruleFunction.forEach(function (ruleFunc) {
      // Fetch the name of the first argument
      var resolveMatches = ruleFunc.toString().match(/function[\s]*\((.*?)[,\)]/);
      var resolveFunctionName = resolveMatches[1];

      if(resolveFunctionName === "") {
        ruleFuncErrors.needResolveArg = true;
      } else {
        // Look for usage of the first argument (presumly "resolve") in the code
        var regex = "\\{[\\s\\S]*" + resolveFunctionName + "[\\s\\S)]*\\}.*$";
        resolveMatches = ruleFunc.toString().match(regex);
        // No call to resolve?
        /*eslint-disable no-extra-parens*/
        if(resolveMatches === null || (resolveMatches && !resolveMatches[0].match(resolveFunctionName + "\\s*[\\(\\)]|\\(\\s*" + resolveFunctionName + "\\s*\\)"))) {
          ruleFuncErrors.needResolveCall = true;
        }
        /*eslint-enable no-extra-parens*/
      }
    });

    if(ruleFuncErrors.needResolveArg) {
      errors.push("before-function-needs-resolve-argument");
    }
    if(ruleFuncErrors.needResolveCall) {
      errors.push("before-function-needs-resolve-call");
    }
    if(ruleFuncErrors.needFunctions) {
      errors.push("before-function-needs-functions");
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
  },
  //
  // Imports a dump created by the option pages export functionality
  // returns a promise that resolves when all rules/Wfs are imported
  importAll: function(dumpString) {
    return new Promise(function (resolve) {
      var promises = [];
      var parsed;

      if(typeof dumpString === "object") {
        parsed = dumpString;
      } else {
        parsed = JSONF.parse(dumpString);
      }

      // Data contains (in case of combined format):
      // parsed.workflows
      // parsed.rules
      //
      // In case of old (rules only) format:
      // parsed.tabSettings
      // parsed.rules

      // Old format with rules only?
      // Convert so it can be imported
      if(typeof parsed.tabSettings !== "undefined") {
        parsed.rules = {
          rules: parsed.rules,
          tabSettings: parsed.tabSettings
        };
        parsed.workflows = [];
      }

      // Save workflows (if any)
      if(typeof parsed.workflows !== "undefined" && parsed.workflows.length > 0) {
        promises.push(Storage.save(parsed.workflows, Utils.keys.workflows));
      }

      // Save the rules in all tabs
      parsed.rules.rules.forEach(function (editorTabAndRules) {
        promises.push(Rules.save(editorTabAndRules.code, editorTabAndRules.tabId));
      });
      // save tabsetting
      promises.push(Storage.save(parsed.rules.tabSettings, Utils.keys.tabs));

      // resolve all saving promises
      Promise.all(promises).then(resolve(parsed));
    });
  },
  exportDataJson: function() {
    return new Promise(function (resolve) {
      var promises = [];
      Storage.load(Utils.keys.tabs).then(function(tabSettings) {
        tabSettings.forEach(function (setting) {
          promises.push(Storage.load(Utils.keys.rules + "-tab-" + setting.id));
        });

        Promise.all(promises).then(function(rulesFromAllTabs) {
          var exportJson = {
            "tabSettings": tabSettings,
            "rules": rulesFromAllTabs
          };
          resolve(exportJson);
        });
      });
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = Rules;
}
// REMOVE END
