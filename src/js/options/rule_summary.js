/*global editor*/
var ruleSummary = {
  currentRow: null
};

editor.selection().on("changeSelection", function(e) {
  // editor.editor().getSelectionRange().start.row
  // Ifsame return as ruleSummary.currentRow;
  // else setTimeout -> generate rule summary (throttle timeout!)
  // editor.getValue().split("\n")
});
