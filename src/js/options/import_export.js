/*global Workflows Logger Storage $ Utils JSONF Rules loadRules currentTabId loadTabsSettings updateTabStats fillAvailableRules loadWorkflows*/
/*eslint no-unused-vars: 0*/
var ImportExport = {
  tmpEncrypted: null,
  // Export rules as a newline seperated list of strings
  exportRulesAsJs: function() {
    var code = "";
    Rules.exportDataJson().then(function(rules) {
      var jsExport = rules.rules.map(function (codeAndTabId, index) {
        return "//\n// Tab: " + rules.tabSettings[index].name + "\n//\n" + codeAndTabId.code.replace(/\\n/g, "\n") + "\n";
      });
      jsExport = jsExport.join("\n").replace(/\\\"/g, '"');

      var now = new Date();
      var fileName = "fof-rules-js-export-" + now.toISOString() + ".js";

      Utils.infoMsg(chrome.i18n.getMessage("imex_export_complete", [ fileName ]));
      Utils.download(jsExport, fileName, "application/json");
    });
  },
  // Export rules and workflows
  exportAll: function() {
    Promise.all([Workflows.exportDataJson(), Rules.exportDataJson()]).then(function(workflowsAndRules) {
      var exportJson = {
        workflows: workflowsAndRules[0],
        rules: workflowsAndRules[1]
      };

      var now = new Date();
      var fileName = "fof-complete-export-" + now.toISOString() + ".js";

      Utils.infoMsg(chrome.i18n.getMessage("imex_export_complete", [ fileName ]));
      Utils.download(JSONF.stringify(exportJson), fileName, "application/json");
    });
  },
  // Show import all modal dialog
  showImportAllModal: function() {
    $("#modalimportall").show();
  },
  // reloads rules shows notification etc for imports
  finishImport: function(parsed) {
    $(".modalimport").hide();
    loadTabsSettings();
    loadRules(1);
    $(".notice.import-ready").find(".imp-wfs-count").html(parsed.workflows.length).end().find(".imp-rules-count").html(parsed.rules.rules.length).end().show();
    updateTabStats();
    fillAvailableRules();
    loadWorkflows();
  },
  // Import encrypted rules & workflows
  importEncryptedModal: function(encryptedString) {
    ImportExport.tmpEncrypted = encryptedString;

    $("#modalimportall").hide();

    // Show password dialog
    $("#modalimportallencrypted").show();
  },
  // Import all rules and workflows from disc
  importAll: function() {
    var $warning = $("#modalimportrules .only-json");
    $warning.hide();
    var fileToImport = document.getElementById("importall").files[0];

    if (typeof fileToImport === "undefined" || (fileToImport.type !== "application/json" && fileToImport.type !== "text/javascript" && fileToImport.type !== "application/javascript")) {
      $warning.show();
    } else {
      var reader = new FileReader();
      reader.onload = function(e) {
        // parse the result
        var parsed = JSONF.parse(e.target.result);

        // Encrypted?
        if (typeof parsed.encrypted !== "undefined") {
          ImportExport.importEncryptedModal(parsed.encrypted);
        } else {
          // Import the parsed rules
          Rules.importAll(e.target.result).then(function() {
            ImportExport.finishImport(parsed);
          });
        }
      };

      // Read file. This calls "onload" above
      reader.readAsText(fileToImport);
    }
  },
  importAllEncrypted: function() {
    var crypt = new Crypto($("#importallpassword").val());
    var decrypted = crypt.decrypt(ImportExport.tmpEncrypted);

    if (decrypted === null) {
      // Error while importing
      // Show error.
      $(".decryption-error").show();
    } else {
      // Import the parsed rules
      var parsed = JSONF.parse(decrypted);
      Rules.importAll(parsed).then(function() {
        ImportExport.finishImport(parsed);
      });
    }
  },
  exportRulesEncrypted: function() {
    //TODO: extract multiple functions here! (FS, 2016-04-22)
    Promise.all([Workflows.exportDataJson(), Rules.exportDataJson()]).then(function(workflowsAndRules) {
      var exportJson = {
        workflows: workflowsAndRules[0],
        rules: workflowsAndRules[1]
      };

      var pwd = $("#export-encrypted-pwd1").val();

      // Add flag if the rules should only be usable as remote import URL
      exportJson.remoteOnly = $("#export-encrypted-remote-only").is(":checked");

      // Encrypt data
      var crypt = new Crypto(pwd);
      pwd = null;
      var encryptedData = crypt.encrypt(JSONF.stringify(exportJson));

      // Final export form:
      exportJson = {
        usage: "Please install Form-O-Fill from https://chrome.google.com/webstore/detail/form-o-fill-the-programma/iebbppibdpjldhohknhgjoapijellonp to use this file.",
        onlyUsableAsRemoteImportUrl: exportJson.remoteOnly,
        encrypted: encryptedData
      };

      var now = new Date();
      var fileName = "fof-complete-export-encrypted-" + now.toISOString() + ".js";

      Utils.infoMsg(chrome.i18n.getMessage("imex_export_complete", [ fileName ]));
      Utils.download(JSONF.stringify(exportJson), fileName, "application/json");
    });
  },
  comparePwd: function() {
    var $button = $(".all-button-export-crypt");
    if ($button.is(":disabled") && $("#export-encrypted-pwd1").val() === $("#export-encrypted-pwd2").val()) {
      $button.removeAttr("disabled");
    }

    if (!$button.is(":disabled") && $("#export-encrypted-pwd1").val() !== $("#export-encrypted-pwd2").val()) {
      $button.attr("disabled", "disabled");
    }
  },
  bindHandlers: function() {
    // Handler Import / Export buttons
    $(document).on("click", ".modalimport .close-button, .modalimport .cmd-cancel", function() {
      $(".modalimport").hide();
    })
    .on("click", ".all-button-export", ImportExport.exportAll)
    .on("click", ".all-button-import", ImportExport.showImportAllModal)
    .on("click", ".cmd-import-all-data", ImportExport.importAll)
    .on("click", ".cmd-import-all-encrypted-data", ImportExport.importAllEncrypted)
    .on("click", ".all-button-export-js", ImportExport.exportRulesAsJs)
    .on("keyup", "#export-encrypted-pwd1, #export-encrypted-pwd2", ImportExport.comparePwd)
    .on("click", ".all-button-export-crypt", ImportExport.exportRulesEncrypted);
  }
};

ImportExport.bindHandlers();
