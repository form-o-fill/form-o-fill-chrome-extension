/*global Logger, Storage, $, Utils, JSONF, Rules, loadRules, currentTabId, loadTabsSettings*/
/*eslint no-unused-vars: 0*/

// data of rules
var exportRulesData = function() {
  return new Promise(function (resolve) {
    var promises = [];
    Storage.load(Utils.keys.tabs).then(function(tabSettings) {
      tabSettings.forEach(function (setting) {
        promises.push(Storage.load(Utils.keys.rules + "-tab-" + setting.id));
      });

      Promise.all(promises).then(function(rulesFromAllTabs) {
        var exportJson = {
          "tabSettings": tabSettings,
          "rules": rulesFromAllTabs
        };
        resolve(exportJson);
      });
    });
  });
};

// export rules to disk
var exportRules = function() {
  exportRulesData().then(function (rulesData) {
    var exportJson = JSONF.stringify(rulesData);
    var now = new Date();
    var fileName = "fof-rules-export-" + now.toISOString() + ".json";

    Logger.info("[options.js] Exporting " + JSONF.stringify(exportJson));
    Utils.download(exportJson, fileName, "application/json");
  });
};

// The data to export
var exportWorkflowsData = function() {
  return new Promise(function (resolve) {
    Storage.load(Utils.keys.workflows).then(function(workflowData) {
      workflowData = workflowData.map(function cbWfDataMap(workflow) {
        workflow.steps = $.makeArray(workflow.steps);
        return workflow;
      });
      resolve(workflowData);
    });
  });
};

// export a workflow to disc
var exportWorkflows = function() {
  exportWorkflowsData().then(function (workflowData) {
    var exportJson = JSONF.stringify(workflowData);
    var now = new Date();
    var fileName = "fof-workflows-export-" + now.toISOString() + ".json";

    Utils.infoMsg("Workflows exported as '" + fileName + "'");
    Utils.download(exportJson, fileName, "application/json");
  });
};

// import Workflows from file
var executeImportWorkflows = function() {
  var $warning = $("#modalimportworkflows .only-json");
  $warning.hide();
  var fileToImport = document.getElementById("importfile").files[0];
  if (typeof fileToImport === "undefined" || fileToImport.type != "application/json") {
    $warning.show();
  } else {
    var reader = new FileReader();
    reader.onload = function(e) {
      var parsed = JSONF.parse(e.target.result);
      Storage.save(parsed, Utils.keys.workflows).then(function () {
        $("#modalimportrules").hide();
        window.location.reload();
      });
    };

    // Read file. This calls "onload" above
    reader.readAsText(fileToImport);
  }
};

// Export rules and workflows
var exportAll = function() {
  Promise.all([exportWorkflowsData(), exportRulesData()]).then(function(workflowsAndRules) {
    var exportJson = {
      workflows: workflowsAndRules[0],
      rules: workflowsAndRules[1]
    };

    var now = new Date();
    var fileName = "fof-complete-export-" + now.toISOString() + ".json";

    Utils.infoMsg("Complete export as '" + fileName + "'");
    Utils.download(JSONF.stringify(exportJson), fileName, "application/json");
  });
};

// Show import all modal dialog
var showImportAllModal = function() {
  $("#modalimportall").show();
};

// Import all rules and workflows from disc
var importAll = function() {
  var $warning = $("#modalimportrules .only-json");
  $warning.hide();
  var fileToImport = document.getElementById("importall").files[0];

  if (typeof fileToImport === "undefined" || fileToImport.type != "application/json") {
    $warning.show();
  } else {
    var reader = new FileReader();
    reader.onload = function(e) {
      var promises = [];
      var parsed = JSONF.parse(e.target.result);

      // Data contains:
      // parsed.workflows
      // parsed.rules

      // Save workflows
      promises.push(Storage.save(parsed.workflows, Utils.keys.workflows));

      // Save the rules in all tabs
      parsed.rules.rules.forEach(function (editorTabAndRules) {
        promises.push(Rules.save(editorTabAndRules.code, editorTabAndRules.tabId));
      });
      // save tabsetting
      promises.push(Storage.save(parsed.rules.tabSettings, Utils.keys.tabs));

      // resolve all saving promises
      Promise.all(promises).then(function () {
        $("#modalimportall").hide();
        loadTabsSettings();
        loadRules(1);
      });
    };

    // Read file. This calls "onload" above
    reader.readAsText(fileToImport);
  }
};

// import and save rules from chosen file
var importAndSaveRules = function() {
  var $warning = $("#modalimportrules .only-json");
  $warning.hide();
  var fileToImport = document.getElementById("rulesimport").files[0];

  if (typeof fileToImport === "undefined" || fileToImport.type != "application/json") {
    $warning.show();
  } else {
    var reader = new FileReader();
    reader.onload = function(e) {
      var parsed = JSONF.parse(e.target.result);
      var promises = [];

      // Save all tabs separatly
      parsed.rules.forEach(function (editorTabAndRules) {
        promises.push(Rules.save(editorTabAndRules.code, editorTabAndRules.tabId));
      });
      // save tabsetting
      promises.push(Storage.save(parsed.tabSettings, Utils.keys.tabs));

      Promise.all(promises).then(function () {
        $("#modalimportrules").hide();
        loadTabsSettings();
        loadRules(1);
      });
    };

    // Read file. This calls "onload" above
    reader.readAsText(fileToImport);
  }
};

// Handler Import / Export buttons
$(document).on("click", "#modalimportrules .cmd-import-all-rules", importAndSaveRules)
.on("click", ".modalimport .close-button, .modalimport .cmd-cancel", function() {
  $(".modalimport").hide();
})
.on("click", ".all-button-export", exportAll)
.on("click", ".all-button-import", showImportAllModal)
.on("click", ".cmd-import-all-data", importAll);
