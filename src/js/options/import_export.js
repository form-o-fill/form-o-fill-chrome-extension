/*global Logger, Storage, $, Utils, JSONF, Rules, loadRules, currentTabId, loadTabsSettings*/
// export rules to disk
var exportRules = function() {
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
      Logger.info("[options.js] Exporting " + JSONF.stringify(exportJson));
      Utils.download(JSONF.stringify(exportJson), "form-o-fill-rules-export.json", "application/json");
    });
  });
};

// Handler if user clicks "Import"
$(document).on("click", "#modalimport .cmd-import-all-rules", function () {
  var $warning = $("#modalimport .only-json");
  $warning.hide();
  var fileToImport = document.getElementById("rulesimport").files[0];
  if (fileToImport.type != "application/json") {
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
        $("#modalimport").hide();
        loadTabsSettings();
        loadRules(1);
      });
    };

    // Read file. This calls "onload" above
    reader.readAsText(fileToImport);
  }
}).on("click", "#modalimport .close-button, #modalimport .cmd-cancel", function () {
  $("#modalimport").hide();
});
