/* global jQuery JSONF Rules Utils state Crypto */
var RemoteImport = {
  handleEncryptedImport: function(url, toImport, reject) {
    var pwd = state.optionSettings.decryptionPassword;

    // Password missing?
    if (typeof pwd === "undefined" || pwd === null || pwd === "") {
      // We resolve here since we need to set the remote URL but
      // need not to activate the import
      reject({url: url, data: null, status: 200, textStatus: "PASSWORD_NOT_SET"});
      return null;
    }

    // Password present
    var crypt = new Crypto(state.optionSettings.decryptionPassword);
    toImport = crypt.decrypt(toImport.encrypted);

    // Decryption failure?
    if (toImport === null) {
      reject({url: url, data: null, status: 501, textStatus: "PASSWORD_DECRYPT_FAILED"});
      return null;
    }

    // Decryption OK!
    return JSONF.parse(toImport);
  },
  import: function(url) {
    return new Promise(function (resolve, reject) {
      jQuery.ajax({url: url, dataType: "text", cache: false})
        .done(function(dataAsString) {
          var toImport = JSONF.parse(dataAsString);

          // Encrypted?
          if (typeof toImport.encrypted !== "undefined") {
            toImport = RemoteImport.handleEncryptedImport(url, toImport, reject);
          }

          if (toImport !== null && Rules.validateImport(toImport)) {
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
  notifyPasswordFailure: function() {
    Notification.create(chrome.i18n.getMessage("import_remote_rules_pwd_text"), chrome.i18n.getMessage("import_remote_rules_pwd_title"), function() {
      Utils.openOptions("#settings");
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
    if (typeof importStruct.workflows !== "undefined" && typeof importStruct.workflows.length !== "undefined") {
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
    url = url ? url : "Wrong format";
    var msg = chrome.i18n.getMessage("import_remote_rules_succeeded", [ url ]);
    if (!success) {
      msg = chrome.i18n.getMessage("import_remote_rules_failed", [ url ]);
    }
    Notification.create(msg, chrome.i18n.getMessage("import_remote_rules_title"), function() {
      Utils.openOptions("#settings");
    });
  },
  listenToExternal: function() {
    chrome.runtime.onMessageExternal.addListener(function(request, sender) {

      // Import via remote URL from
      // http://form-o-fill.github.io/import-remote-rules
      if (request.action === "importRemoteRules") {

        // Check the URL
        if (/import-remote-rules\/\?i=http.*\.(js|json).*$/.test(sender.url)) {

          // Extract the i=parameter
          var matches = sender.url.match(/i=(.*\.(js|json).*)/);

          // Is a URL present?
          if (typeof matches[1] !== "undefined") {
            var url = decodeURIComponent(matches[1]);
            // Import rules from URL
            RemoteImport.import(url).then(function(resolved) {
              // Save to shadow storage
              RemoteImport.save(resolved.data);

              // Now change settings and activate import
              state.optionSettings.importActive = true;
              state.optionSettings.importUrl = url;

              // send to settings.js:
              chrome.runtime.sendMessage({action: "saveSettings", message: state.optionSettings});

              RemoteImport.notifySuccess(true, url);
            }).catch(function(rejected) {
              // If the password was not set, save the url to settings
              if (rejected.textStatus === "PASSWORD_NOT_SET") {
                state.optionSettings.importActive = false;
                state.optionSettings.importUrl = url;
                chrome.runtime.sendMessage({action: "saveSettings", message: state.optionSettings});

                // Notify the user
                RemoteImport.notifyPasswordFailure();
              } else {
                RemoteImport.notifySuccess(false, url);
              }
            });
          }
        } else {
          RemoteImport.notifySuccess(false, null);
        }
      }
    });
  }
};

// REMOVE STAR
if (typeof exports === "object") {
  module.exports = RemoteImport;
}
// REMOVE END
