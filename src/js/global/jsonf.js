/*eslint no-new-func:0*/
"use strict";
var JSONF = {
  stringify: function(object) {
    return JSON.stringify(object, this._functionSerializer);
  },
  parse: function(jsonString) {
    return JSON.parse(jsonString, this._functionDeserializer);
  },
  _functionSerializer: function(key, value) {
    if (typeof (value) === "function") {
      return value.toString();
    }
    return value;
  },
  _functionDeserializer: function(key, value) {
    if (key === "" && value.indexOf("function") !== 0) {
      return value;
    }

    if (typeof value === "string") {
      var rfunc = /^function[^\(]*\(([^\)]*)\)[^\{]*{([^\}]*)\}/;
      var match = value.match(rfunc);

      if (match) {
        var args = match[1].split(',').map(function(arg) {
          return arg.replace(/\s+/, '');
        });
        return new Function(args, match[2].trim());
      }
    }
    return value;
  }
};
