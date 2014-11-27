/*global $, JSONEditor, ace, Storage, Logger, Utils, Rules, Rule, I18n, ChromeBootstrap, Editor, JSONF */
/*eslint no-unused-vars: [2, { "vars": "local"}]*/
// This file is a big bag of mixed responsibilities.
// Break this into parts!
var editor = new Editor("#ruleeditor-ace");
editor.resize();

var noticesVisible = false;

I18n.loadPages(["help", "about", "changelog", "modalimport"]);

if(Utils.debug) {
  I18n.loadPages(["logs"]);
}

ChromeBootstrap.init();

// reset notices once the user starts typing again
editor.on("change", function() {
  if(noticesVisible) {
    $("#ruleeditor .notice").hide();
    noticesVisible = false;
  }
});

// Current active tab id
var currentTabId = function() {
  var currentTab = $(".tab.current");
  if(currentTab.length === 1) {
    return currentTab.data("tab-id");
  }
  return 1;
};

// Append text to the end of the rule definitions
var appendRule = function(prettyRule, responseCallback) {
  // Use
  Rules.load().then(function(rulesFunction) {
    var lines = [];
    if(rulesFunction.length > 0) {
      lines.push(",");
    }
    lines = lines.concat(prettyRule.split("\n"));
    editor.document().insertLines(editor.document().getLength() - 1, lines);

    // Prettify code a little
    editor.session().setValue(Rules.format(editor.session().getValue()), -1);
    editor.scrollToRow(editor.document().getLength());
    responseCallback();
    Utils.infoMsg("Rule added on line " + (editor.document().getLength() - 1));
  });
};

// Check for freshly extracted rules and show UI
Storage.load(Utils.keys.extractedRule).then(function (extractedRule) {
  // There are extracted rules
  if (typeof extractedRule !== "undefined") {
    var $notice = $("#ruleeditor .notice.extracted-present");
    $notice.show();
    $("#ruleeditor .cmd-append-extracted").on("click", function () {
      Logger.info("[options.js] Appending extracted rules to the end of the definition");
      appendRule(extractedRule, function() {
        $notice.hide();
        Storage.delete(Utils.keys.extractedRule);
      });
    });
  }
});

// Check for rule filling errors
Storage.load(Utils.keys.errors).then(function (errorsStorage) {
  if(typeof errorsStorage !== "undefined") {
    var rule = errorsStorage.rule;
    var errors = errorsStorage.errors;
    var $notice = $("#ruleeditor .notice.form-fill-errors");
    var tableTrs = [];
    var fullMsg = false;
    errors.forEach(function (error) {
      Logger.info("[options.js] Got error " + JSONF.stringify(error) + " for rule " + JSONF.stringify(rule));
      if(typeof error.fullMessage !== "undefined") {
        // One line output
        tableTrs.push("<tr><td>" + error.fullMessage + "</td></tr>");
        fullMsg = true;
      } else {
        // Typically an error in a rule
        tableTrs.push("<tr><td>" + error.selector + "</td><td>" + error.value + "</td><td>" + error.message + "</td></tr>");
      }
    });
    $notice.find("table").append(tableTrs.join("\n"));
    if(fullMsg) {
      $notice.find("#form-filling-errors-thead").remove();
    }
    $notice.find(".rule-name").html(rule.nameClean);
    $notice.find(".rule-url").html(rule.urlClean);
    $notice.show();
    Storage.delete(Utils.keys.errors);

    // Activate the tab with the rule
    var match = rule.id.match(/^([0-9]+)/);
    if(match) {
      Logger.info("[options.js] Activating tab #" + match[1]);
      $(".tab[data-tab-id='" + match[1] + "']").trigger("click");
    }
  }
});

// Read all rules to update stats
// Also fill quickjump select
var updateTabStats = function() {
  Rules.all().then(function (rules) {
    var rulesStats = { tabCount: {}, rules: []};

    rules.forEach(function (rule) {
      // Count rules
      if (typeof rulesStats.tabCount[rule.tabId] === "undefined") {
        rulesStats.tabCount[rule.tabId] = 0;
      }
      rulesStats.tabCount[rule.tabId] += 1;
      rulesStats.rules.push({
        name: rule.nameClean,
        id: rule.id
      });
    });

    // rulesStats has now a count of all rules per tab
    Object.keys(rulesStats.tabCount).forEach(function (key) {
      $(".tab[data-tab-id='" + key + "'] .rule-count").html("(" + rulesStats.tabCount[key] + ")");
    });

    // Fill <select> rules overview
    var options = ["<option value=''>- quickjump to rule -</option>"];

    // Remove rules without names (eg. libs)
    var onlyRealRules = rulesStats.rules.filter(function (rule) {
       return typeof rule.name != "undefined";
    });

    // Create <option> tags for sorted list of rules and insert into DOM
    Utils.sortRules(onlyRealRules).forEach(function (rule) {
      options.push("<option value='" + rule.id + "'>" + rule.name + "</option>");
    });
    $("#rules-overview").html(options.join(""));
  });
};

// Save the rules
var saveRules = function(tabId) {
  var errors = Rules.syntaxCheck(editor);
  if(errors.length > 0) {
    errors.forEach(function (errorClass) {
      $("#ruleeditor .notice." + errorClass).show();
    });
    noticesVisible = true;
  }

  if(editor.cleanUp()) {
    Rules.save(editor.getValue(), tabId).then(function () {
      Utils.infoMsg("Rules saved");
      updateTabStats();
    });
  }
};

var loadRules = function(tabId) {
  Storage.load(Utils.keys.rules + "-tab-" + tabId).then(function (ruleData) {
    var ruleJson = ruleData.code;
    if(typeof ruleJson === "undefined") {
      ruleJson = "";
    }
    editor.setValue(ruleJson, -1);
    //BROKEN! editor.fixRules();
    Utils.infoMsg("Rules loaded from disc");
  });
};

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

var quickJumpToRule = function() {
  var selected = $(this).find("option:selected");
  var tabId = selected.val().split("-")[0];
  var name = selected.text();

  // If the target tab is not the active one, click to trigger
  if($(".tab.current").data("tab-id").toString() !== tabId) {
    $(".tab[data-tab-id=" + tabId + "]").trigger("click");
  }

  var found = editor.editor().find(name, { backwards: false, skipCurrent: false }, false);
  editor.editor().gotoLine(found.start.row, 1, false);
};

// Load data from tab and prefill editor
loadRules(currentTabId());
updateTabStats();

// Button handling for "save" and "load"
$(".editor .menu").on("click", "button.save", function () {
  saveRules(currentTabId());
}).on("click", "button.reload", function () {
  loadRules(currentTabId());
}).on("click", "button.format", function () {
  editor.format(Rules);
  Utils.infoMsg("Rules formatted but not saved");
}).on("click", "button.export", exportRules)
.on("click", "button.import", importRules);

// Export all rules (for modal import dialog)
$(document).on("click", "a.cmd-export-all-rules", function() {
  exportRules();
});

// Support for the quickjump <select>
$("#rules-overview").on("change", quickJumpToRule);

// Event handler for notices
$(".notice.form-fill-errors").on("click", function () {
  Storage.delete(Utils.keys.errors);
  $(this).hide();
});

$(".notice.extracted-present").on("click", function () {
  Storage.delete(Utils.keys.extractedRule);
  $(this).hide();
});

$(".notice.annotations-present, .notice.error").on("click", function () {
  $(this).hide();
});

