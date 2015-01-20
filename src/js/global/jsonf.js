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
    if (key === "" && typeof value === "string" && value.indexOf("function") !== 0 && value.indexOf("/") !== 0) {
      return value;
    }

    if (typeof value === "string") {
      var rfunc = /^function\s*(\w*)\s*\((.*?)\)[\s\S]*?\{([\s\S]*)\}/m;
      var rregexp = /^\/(.*?)\/$/m;
      var match = value.match(rfunc);

      // Function?
      if (match) {
        var args = match[2].split(',').map(function(arg) {
          return arg.replace(/\s+/, '');
        });
        return new Function(args, match[3].trim());
      }

      // RegEx?
      match = value.match(rregexp);
      if (match) {
        return new RegExp(match[1]);
      }

      // Undefined?
      if(value === JSONF._undef) {
        return undefined;
      }
    }
    return value;
  }
};
// REMOVE START
if(typeof exports === "object") {
  module.exports = JSONF;
}
// REMOVE END
