/*global Logger, Storage, $, Utils, JSONF, Rules, loadRules, currentTabId, loadTabsSettings, updateTabStats, fillAvailableRules, loadWorkflows*/
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

// The workflow data to export
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

// Export rules and workflows
var exportAll = function() {
  Promise.all([exportWorkflowsData(), exportRulesData()]).then(function(workflowsAndRules) {
    var exportJson = {
      workflows: workflowsAndRules[0],
      rules: workflowsAndRules[1]
    };

    var now = new Date();
    var fileName = "fof-complete-export-" + now.toISOString() + ".json";

    Utils.infoMsg("Completed export as '" + fileName + "'");
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

      // Data contains (in case of combined format):
      // parsed.workflows
      // parsed.rules
      //
      // In case of old (rules only) format:
      // parsed.tabSettings
      // parsed.rules

      // Old format with rules only?
      // Convert so it can be imported
      if(typeof parsed.tabSettings !== "undefined") {
        parsed.rules = {
          rules: parsed.rules,
          tabSettings: parsed.tabSettings
        };
        parsed.workflows = [];
      }

      // Save workflows (if any)
      if(typeof parsed.workflows !== "undefined") {
        promises.push(Storage.save(parsed.workflows, Utils.keys.workflows));
      }

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
        $(".notice.import-ready").find(".imp-wfs-count").html(parsed.workflows.length).end().find(".imp-rules-count").html(parsed.rules.rules.length).end().show();
        updateTabStats();
        fillAvailableRules();
        loadWorkflows();
      });
    };

    // Read file. This calls "onload" above
    reader.readAsText(fileToImport);
  }
};

// Handler Import / Export buttons
$(document).on("click", ".modalimport .close-button, .modalimport .cmd-cancel", function() {
  $(".modalimport").hide();
})
.on("click", ".all-button-export", exportAll)
.on("click", ".all-button-import", showImportAllModal)
.on("click", ".cmd-import-all-data", importAll);
