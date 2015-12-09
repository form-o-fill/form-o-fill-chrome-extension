/* global jQuery JSONF Rules */
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
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = RemoteImport;
}
// REMOVE END
