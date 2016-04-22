/*global editor jQuery Rules Workflows*/
var ruleSummary = {
  currentRow: null,
  refeshTimeout: false
};

var ruleSummaryShow = function(show) {
  var method = show ? "remove" : "add";
  document.querySelector(".rule-summary").classList[method]("hidden");
};

/*eslint-disable complexity */
var ruleSummaryFind = function(term, startInRow, backward) {
  var src = editor._document.getAllLines();

  if (typeof backward !== "boolean") {
    backward = true;
  }

  if (typeof startInRow === "undefined") {
    startInRow = 0;
  }
  var i = startInRow;

  if (backward) {
    for (i = startInRow; i >= 0; i--) {
      if (src[i].match(term)) {
        return src[i];
      }
    }
  } else {
    for (i = startInRow; i < src.length; i++) {
      if (src[i].match(term)) {
        return src[i];
      }
    }
  }

  return null;
};

var ruleSummaryYesNo = function(selector, foundTheRule) {
  var $wf = document.querySelector(selector);
  $wf.innerHTML = foundTheRule ? "Yes" : "No";
  $wf.classList.remove("no");
  $wf.classList.remove("yes");
  $wf.classList.add(foundTheRule ? "yes" : "no");
};

//
// Refresh all items in the rule summary
var ruleSummaryRefreshByRule = function(rule) {
  ruleSummary.currentRule = rule;

  document.querySelector(".rule-fields-count").innerHTML = rule.fields.length;

  var usesImport = rule.fields.some(function(fieldDef) {
    return typeof fieldDef.import !== "undefined";
  });

  Workflows.all().then(function(arrayOfWfs) {
    var foundTheRule = arrayOfWfs.some(function(aWorkflow) {
      return jQuery.makeArray(aWorkflow.steps).some(function(ruleName) {
        return ruleName === rule.name;
      });
    });

    ruleSummaryYesNo(".rule-workflow-part", foundTheRule);
    ruleSummaryYesNo(".rule-import-part", usesImport);
    ruleSummaryYesNo(".rule-autorun-part", rule.autorun === true);
    ruleSummaryYesNo(".rule-empty-only-part", rule.onlyEmpty === true);
    ruleSummaryYesNo(".rule-screenshot-at-end", rule.screenshot === true);

    ruleSummaryShow(true);
  });
};

var ruleSummaryRefresh = function() {
  var row = editor.editor().getSelectionRange().start.row;

  if (row !== ruleSummary.currentRow) {
    ruleSummary.currentRow = row;

    var currentLine = editor.session().getLine(row);
    var back = true;

    // If the current line is the url, cahcnes are we should look forward instead of backward
    if (/url/.test(currentLine)) {
      back = false;
    }

    // try to find the "name" attribute in the first direction
    var line = ruleSummaryFind(/name["']?\s*:/, row, back);

    if (!line) {
      // try in the oter direction ...
      back = !back;
      line = ruleSummaryFind(/name["']?\s*:/, row, back);
    }

    if (line) {
      // Extract name:
      var nameMatches = line.match(/:\s*["'](.*?)["']/);
      if (nameMatches[1] !== "") {
        ruleSummary.name = nameMatches[1];
      }
      document.querySelector(".rule-name").innerHTML = ruleSummary.name;

      Rules.findByName(ruleSummary.name).then(ruleSummaryRefreshByRule);
    }
  }
  ruleSummary.refeshTimeout = false;
};
/*eslint-enable complexity */

// A changeSelection event is trigger by the ACE editor
// when a use clicks inside the editor.
// Sadly it is triggered way to often so we
// need to throttle it down.
editor.selection().on("changeSelection", function() {
  if (!ruleSummary.refeshTimeout) {
    ruleSummary.refeshTimeout = true;
    setTimeout(ruleSummaryRefresh, 1000);
  }
});

// Hide or show rule summary
// when the user clicks on the menu item
jQuery(".menu a").on("click", function() {
  if (!this.classList.contains("the-rule-editor-menu")) {
    ruleSummaryShow(false);
  }
});
