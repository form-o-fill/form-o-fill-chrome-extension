/*global Storage, Utils, jQuery, js_beautify */
/*eslint no-new-func:0*/
"use strict";

/* A single Rule */
var Rule = function() {
  this.prettyPrint = function() {
    var clone = jQuery.extend({}, this);
    delete clone.matcher;
    return JSON.stringify(clone, null, 2);
  };

  this.prettyPrintHtml = function() {
    return this.prettyPrint().replace(/\n/,"<br />");
  };
};

Rule.create = function(options) {
  var rule = new Rule();
  Object.keys(options).forEach(function(key) {
    rule[key] = options[key];
  });
  rule.matcher = new RegExp(rule.url);
  rule.nameClean = this.name.replace("<", "&lt;");
  return rule;
};

/* Multiple Rules */
var Rules = {
  cache: null,
  ruleCount: 0,
  matchesForUrl: function(url) {
    var rules = this;
    return new Promise(function (resolve) {
      rules.load().then(function(rules) {
        var matchingRules = rules.filter(function (rule) {
          return url.match(rule.matcher);
        });
        resolve(matchingRules);
      });
    });
  },
  load: function() {
    var that = this;
    return new Promise(function (resolve) {
      if(that.cache) {
        Utils.log("Rules.load resolved using " + that.cache.length + " cache entries");
        resolve(that.cache);
      }
      Storage.load().then(function (rulesCode) {
        var rules = [];
        if(rulesCode) {
          // remove wrapper
          var rulesCodeMatches = rulesCode.match(/^.*?(\[[\s\S]*\];)$/m);

          // This should not happen:
          if(!rulesCodeMatches[1]) {
            resolve(rules);
          }

          // Now we go into hell ...
          // TODO: remove unsafe-eval from manifest and use a chrome sandbox iframe
          var ruleCode = "return " + rulesCodeMatches[1].replace(/\\n/g,"");
          var ruleFunction = new Function(ruleCode);
          that.ruleCount = 0;

          rules = ruleFunction().map(function (ruleJson) {
            that.ruleCount += 1;
            return Rule.create(ruleJson);
          });
        }
        that.cache = rules;
        resolve(rules);
      });
    });
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
  }
};

