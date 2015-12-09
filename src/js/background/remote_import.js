/* global jQuery JSONF Rules Utils */
var RemoteImport = {
  import: function(url) {
    return new Promise(function (resolve, reject) {
      //TODO: use fetch here (polyfill: https://github.com/github/fetch) (FS, 2015-12-09)
      jQuery.ajax({url: url, dataType: "text"})
        .done(function(dataAsString) {
          var toImport = JSONF.parse(dataAsString);
          if(Rules.validateImport(toImport)) {
            resolve({url: url, data: toImport, status: 200, textStatus: "OK"});
          } else {
            reject({url: url, data: null, status: 501, textStatus: "FORMAT"});
          }
        })
      .fail(function(jqXhr, textStatus) {
        reject({url: url, data: null, status: jqXhr.status, textStatus: textStatus});
      });
    });
  },
  save: function(importStruct) {
    // Imports the given rules into a shadow storage that is used in addition
    // to the normal visible rules when searching for matching rules

    var data = {
      workflows: [],
      rules: [],
      lastUpdate: null
    };

    // Save workflows (if any)
    if(typeof importStruct.workflows !== "undefined" && typeof importStruct.workflows.length !== "undefined") {
      data.workflows = importStruct.workflows;
    }

    // Save the rules in all tabs
    data.rules = importStruct.rules.rules.map(function (editorTabAndRules) {
      return editorTabAndRules.code;
    });

    data.lastUpdate = Date.now();

    return Storage.save(data, Utils.keys.shadowStorage);
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = RemoteImport;
}
// REMOVE END
