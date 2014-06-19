/*global RuleStorage, Utils, jQuery */
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
  return rule;
};

/* Multiple Rules */
var Rules = {
  cache: null,
  matchesForUrl: function(url) {
    var rules = this;
    return new Promise(function (resolve) {
      rules._load().then(function(rules) {
        var matchingRules = rules.filter(function (rule) {
          return url.match(rule.matcher);
        });
        resolve(matchingRules);
      });
    });
  },
  _load: function() {
    var that = this;
    return new Promise(function (resolve) {
      if(that.cache) {
        Utils.log("Rules.load resolved using " + that.cache.length + " cache entries");
        resolve(that.cache);
      }
      RuleStorage.loadRules().then(function (rulesCode) {
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

          rules = ruleFunction().map(function (ruleJson) {
            return Rule.create(ruleJson);
          });
        }
        that.cache = rules;
        resolve(rules);
      });
    });
  }
};

