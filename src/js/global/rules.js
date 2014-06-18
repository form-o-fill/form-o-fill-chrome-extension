/*global RuleStorage, Utils*/
"use strict";

/* A single Rule */
var Rule = function() {
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
  load: function() {
    var that = this;
    return new Promise(function (resolve) {
      if(that.cache) {
        Utils.log("Rules.load resolved using " + that.cache.length + " cache entries");
        resolve(that.cache);
      }
      RuleStorage.loadRules().then(function (rulesJson) {
        var rules = rulesJson.map(function (ruleJson) {
          return Rule.create(ruleJson);
        });
        that.cache = rules;
        resolve(rules);
      });
    });
  },
  save: function(rulesJson) {
    var that = this;
    return new Promise(function (resolve) {
      var rules = rulesJson.map(function (ruleJson) {
        return ruleJson;
      });
      that.cache = null;
      RuleStorage.saveRules(rules).then(resolve(true));
    });
  },
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
  }
};

