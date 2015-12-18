/*global Workflows Logger Storage $ Utils JSONF Rules loadRules currentTabId loadTabsSettings updateTabStats fillAvailableRules loadWorkflows*/
/*eslint no-unused-vars: 0*/
var ImportExport = {
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
    $("#modalimportall").hide();
    loadTabsSettings();
    loadRules(1);
    $(".notice.import-ready").find(".imp-wfs-count").html(parsed.workflows.length).end().find(".imp-rules-count").html(parsed.rules.rules.length).end().show();
    updateTabStats();
    fillAvailableRules();
    loadWorkflows();
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
        var parsed = JSONF.parse(e.target.result);
        Rules.importAll(e.target.result).then(function() {
          ImportExport.finishImport(parsed);
        });
      };

      // Read file. This calls "onload" above
      reader.readAsText(fileToImport);
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
    .on("click", ".all-button-export-js", ImportExport.exportRulesAsJs);
  }
};

ImportExport.bindHandlers();
