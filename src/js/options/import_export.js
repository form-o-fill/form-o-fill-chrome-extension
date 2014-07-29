/*global Logger, Storage, $, Utils, JSONF*/
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

// import rules from disc
var importRules = function() {
  $("#modalimport").show();
};

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
      Storage.save(parsed.tabSettings, Utils.keys.tabs).then(function () {
        debugger;
      });
    };
    reader.readAsText(fileToImport);
  }
});
