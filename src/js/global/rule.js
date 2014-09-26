/*global Logger, jQuery */

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

// REMOVE START
if(typeof exports === "object") {
  module.exports = Rule;
}
// REMOVE END
