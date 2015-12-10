/* global jQuery JSONF Rules Utils optionSettings */
var RemoteImport = {
  import: function(url) {
    return new Promise(function (resolve, reject) {
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
  },
  notifySuccess: function(success, url) {
    url = url ? url : "wrong format";
    var txt = "Importing remote rules " + (success ? "succeeded" : "failed") + "!\nURL: " + url;
    Notification.create(txt, "Remote rules import!", function() {
      Utils.openOptions("#settings");
    });
  },
  listen: function() {
    chrome.runtime.onMessageExternal.addListener(function(request, sender) {
      if(/import-remote-rules\/\?i=http.*\.js$/.test(sender.url)) {
        // Extract the i=parameter
        var matches = sender.url.match(/i=(.*\.js)/);
        if(typeof matches[1] !== "undefined") {
          var url = decodeURIComponent(matches[1]);
          // Import rules from URL
          RemoteImport.import(url).then(function(resolved) {
            // Save to shadow storage
            RemoteImport.save(resolved.data);

            // Now change settings and activate import
            optionSettings.importActive = true;
            optionSettings.importUrl = url;

            // send to settings.js:
            chrome.runtime.sendMessage({action: "saveSettings", message: optionSettings});

            RemoteImport.notifySuccess(true, url);
          }).catch(function() {
            RemoteImport.notifySuccess(false, url);
          });
        }
      } else {
        RemoteImport.notifySuccess(false, null);
      }
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = RemoteImport;
}
// REMOVE END
