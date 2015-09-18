/*global editor jQuery*/
var ruleSummary = {
  currentRow: null,
  refeshTimeout: false
};

// Hide or show rule summary
jQuery(".menu a").on("click", function() {
  if(this.classList.contains("the-rule-editor-menu")) {
    jQuery(".rule-summary").removeClass("hidden");
  } else {
    jQuery(".rule-summary").addClass("hidden");
  }
});


var ruleSummaryFind = function(term, startInRow, backward) {
  var src = editor._document.getAllLines();

  if(typeof backward !== "boolean") {
    backward = true;
  }

  if(typeof startInRow === "undefined") {
    startInRow = 0;
  }
  var i = startInRow;

  if(backward) {
    for(i = startInRow; i >= 0; i--) {
      if(src[i].match(term)) {
        return src[i];
      }
    }
  } else {
    for(i = startInRow; i <= src.length; i++) {
      if(src[i].match(term)) {
        return src[i];
      }
    }
  }

  return null;
};

var ruleSummaryRefresh = function() {
  var row = editor.editor().getSelectionRange().start.row;
  if(row !== ruleSummary.currentRow) {
    ruleSummary.currentRow = row;
    // try to find the "name" attrribute backwards
    var line = ruleSummaryFind(/name["']?\s*:/, row, true);

    if(!line) {
      // try forward ...
      line = ruleSummaryFind(/name["']?\s*:/, row, false);
    }

    if(line) {
      // Extract name:
      // TODO!
      ruleSummary.name = null;

      // Now try to find the opening rule bracket
      // to scope the next search
      line = ruleSummaryFind(/{$/, row, true);
    }
  }
};

// A changeSelection event is trigger by the ACE editor
// when a use clicks inside the editor.
// Sadly it is triggered way to often so we
// need to throttle it down.
editor.selection().on("changeSelection", function() {
  if(!ruleSummary.refeshTimeout) {
    ruleSummary.refeshTimeout = true;
    setTimeout(ruleSummaryRefresh, 1000);
  }
  // Ifsame return as ruleSummary.currentRow;
  // else setTimeout -> generate rule summary (throttle timeout!)
  // editor.getValue().split("\n")
});
