/*global Storage, Logger, jQuery, js_beautify, Utils, JSONF */
/*eslint no-new-func:0, max-nested-callbacks:[1,4]*/
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
  rule.id = tabId + "-" + ruleIndex;
  Logger.info("[rule.js] created rule", rule);
  return rule;
};

/* Multiple Rules */
var Rules = {
  ruleCount: 0,
  match: function(url, content) {
    var rules = this;
    return new Promise(function (resolve) {
      Promise.all([rules.matchesForContent(content), rules.matchesForUrl(url)]).then(function (matches) {
        matches = [].concat.apply(matches[0], matches[1]);

        // Unique:
        var finalMatches = [];
        var keys = {};
        matches.forEach(function (rule) {
          if (typeof keys[rule.id] === "undefined") {
            finalMatches.push(rule);
            keys[rule.id] = true;
          }
        });

        resolve(finalMatches);
      });
    });
  },
  matchesForContent: function(content) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.all().then(function(rules) {
        var matchingRules = rules.filter(function (rule) {
          return typeof rule.content !== "undefined" && content.match(rule.content);
        });
        resolve(matchingRules);
      });
    });
  },
  matchesForUrl: function(url) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.all().then(function(rules) {
        var matchingRules = rules.filter(function (rule) {
          return typeof rule.url !== "undefined" && url.match(rule.matcher);
        });
        resolve(matchingRules);
      });
    });
  },
  load: function(forTabId) {
    var that = this;
    return new Promise(function (resolve) {
      Storage.load(that._nameForTabId(forTabId)).then(function (rulesCode) {
        var rules = [];
        if(rulesCode) {
          // remove wrapper
          var rulesCodeMatches = rulesCode.match(/^.*?(\[[\s\S]*\];)$/m);

          // This should not happen:
          if(!rulesCodeMatches[1]) {
            resolve(rules);
          }

          // Now we go into hell ...
          var ruleCode = "return " + rulesCodeMatches[1].replace(/\\n/g,"");
          var ruleFunction = new Function(ruleCode);
          that.ruleCount = 0;

          rules = ruleFunction().map(function (ruleJson, index) {
            that.ruleCount += 1;
            return Rule.create(ruleJson, forTabId, index);
          });
        }
        resolve(rules);
      });
    });
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
      Storage.save(ruleCode, Rules._nameForTabId(activeTabId)).then(function () {
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
      "brace_style": "expand",
      "space_before_conditional": true,
      "unescape_strings": false
    });
    if(/\}\];$/.test(prettyCode)) {
      prettyCode = prettyCode.replace(/\}\];$/, "}\n];");
    }
    return prettyCode;
  },
  // Simple checks for the neccessary structure of the rules
  syntaxCheck: function(editor) {
    var errors = [];

    // Check if there are some ACE Annotations (aka. errors) present
    var annotationCount =  editor.session().getAnnotations().length;
    if(annotationCount > 0) {
      errors.push("annotations-present");
    }

    // Check structure of rules code
    if(!/^(var\s+)?([a-z_])+\s+=\s+\[\s?$/i.test(editor.session().getLine(0)) ||
       !/^\s*\];\s*$/.test(editor.session().getLine(editor.session().getLength() - 1))) {
      errors.push("var-needed");
    }

    return errors;
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

