/*eslint no-new-func:0, complexity: 0*/
var JSONF = {
  _undef: "**JSONF-UNDEFINED**",
  stringify: function(object) {
    return JSON.stringify(object, this._serializer, 2);
  },
  parse: function(jsonString) {
    return JSON.parse(jsonString, this._deserializer);
  },
  _serializer: function(key, value) {
    // undefined
    if (typeof value === "undefined") {
      return JSONF._undef;
    }

    // Is a FUNCTION or REGEXP ?
    if (value !== null && (typeof value === "function" || typeof value.test === "function")) {
      return value.toString();
    }
    return value;
  },
  _deserializer: function(key, value) {
    // Return simple value if...
    // 1. not a function
    // 2. not a regex
    // 3. not an es2015 arrow function
    if (key === "" && typeof value === "string" && value.indexOf("function") !== 0 && value.indexOf("/") !== 0 && /\s*=>\s*/.test(value) === false) {
      return value;
    }

    if (typeof value === "string") {
      // A regex for normal "function"
      var rfunc = /^function\s*(\w*)\s*\(([\s\S]*?)\)[\s\S]*?\{([\s\S]*)\}/m;

      // A regex for es2015 arrow functions
      var rarrowFunc = /\(?(.*?)\)?\s*=>\s*\{([\s\S]*?)\}/m;
      var rarrowFuncImplRet = /\((.*?)\)\s*=>\s*([^;\n]*)/;

      // A regex for regexes
      var rregexp = /^\/(.*?)\/$/m;

      var match = value.match(rfunc);

      // Function?
      if (match) {
        var args = match[2].split(',').map(function(arg) {
          return arg.replace(/\s+/, '');
        });
        return new Function(args, match[3].trim());
      }

      // ES2015 arrow function with brackets
      match = value.match(rarrowFunc);
      if (match) {
        // 1: function arguments
        // 2: function body (without {})
        return new Function(JSONF.cleanArgs(match[1]), match[2].trim());
      }

      // ES2015 arrow function without brackets (implicit return)
      match = value.match(rarrowFuncImplRet);
      if (match) {
        // 1: function arguments
        // 2: function body;
        return new Function(JSONF.cleanArgs(match[1]), "return " + match[2].trim());
      }

      // RegEx?
      match = value.match(rregexp);
      if (match) {
        return new RegExp(match[1]);
      }

      // Undefined?
      if (value === JSONF._undef) {
        return undefined;
      }
    }
    return value;
  },
  cleanArgs: function(argsAsString) {
    return argsAsString.split(',').map(function(arg) {
      return arg.replace(/\s+/, '');
    });
  }
};
// REMOVE START
if (typeof exports === "object") {
  module.exports = JSONF;
}
// REMOVE END
