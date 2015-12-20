import * as jQuery from "jQuery";
import * as Logger from "../debug/logger";

/* A single Rule */
let Rule = function() {
  this.prettyPrint = function() {
    var clone = jQuery.extend({}, this);
    delete clone.matcher;
    delete clone.nameClean;
    delete clone.urlClean;
    delete clone.id;
    delete clone.tabId;
    delete clone.type;
    delete clone.autorun;
    delete clone.screenshot;
    //TODO: check to see if onlyEmpty should be included (FS, 2015-12-04)
    delete clone.onlyEmpty;
    delete clone.color;
    delete clone.shadow;
    delete clone._escapeForRegexp;
    return JSON.stringify(clone, null, 2);
  };

  this._escapeForRegexp = function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
};

/*eslint-disable complexity*/
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

  if(typeof rule.name !== "undefined") {
    rule.nameClean = rule.name.replace("<", "&lt;");
  }

  if(typeof rule.id === "undefined") {
    rule.id = tabId + "-" + ruleIndex;
  }

  if(typeof rule.autorun === "undefined") {
    rule.autorun = false;
  }

  if(typeof rule.onlyEmpty === "undefined") {
    rule.onlyEmpty = false;
  }

  if(typeof rule.shadow === "undefined") {
    rule.shadow = false;
  }

  rule.tabId = tabId;

  // REMOVE START
  if(rule.export && rule.lib) {
    Logger.debug("[rule.js] created rule (with lib named '" + rule.export + "' )", rule);
  } else {
    Logger.debug("[rule.js] created rule", rule);
  }
  // REMOVE END

  return rule;
};
/*eslint-enable complexity*/

module.exports = Rule;
