/*global ace*/
var Editor = function(selector) {
  this._editor = ace.edit(document.querySelector(selector));
  this._session = this._editor.getSession();
  this._document = this._session.getDocument();
  this._editor.setTheme("ace/theme/jsoneditor");
  this._session.setMode("ace/mode/javascript");
  this._session.setTabSize(2);
  this._session.setUseSoftTabs(true);
};

Editor.prototype.editor = function() {
  return this._editor;
};

Editor.prototype.session = function() {
  return this._session;
};

Editor.prototype.document = function() {
  return this._document;
};

Editor.prototype.getValue = function() {
  return this._editor.getValue();
};

Editor.prototype.setValue = function(value) {
  return this._editor.setValue(value);
};

// Add event listeners to the editor
Editor.prototype.on = function(eventName, callback) {
  this._session.on(eventName, callback);
};

// Cleans up the rules code
// eg. remove trailing newlines
Editor.prototype.cleanUp = function() {
  var lastLineIndex = this._document.getLength() - 1;
  var line = null;
  for(var i = lastLineIndex; i > 0; i--) {
    line = this._document.getLine(i).trim();
    if(line === "") {
      this._document.removeLines(i,i);
    } else {
      break;
    }
  }
  return true;
};

Editor.prototype.fixRules = function() {
  // Fix the first line not correctly containing "var rules = ["
  var lineStart = this._document.getLine(0);
  var lineCount = this._document.getLength();
  var lineEnd = this._document.getLine(lineCount - 1);
  var AceRange = ace.require('ace/range').Range;

  if(lineStart.indexOf("{") > -1) {
    // Assume "var rules = [" is missing
    this._document.insertLines(0, [ "var rules = [" ]);
  } else {
    this._document.replace(new AceRange(0,0,0,999), "var rules = [");
  }

  // }]; at end?
  if(/^\s*\}\s*\];\s*$/.test(lineEnd)) {
    this._document.removeLines(lineCount - 1, lineCount - 1);
    this._document.insertLines(lineCount, [ "}" ]);
  }

  // Fix the last line not containing "];"
  if(!/^\s*\];\s*$/.test(lineEnd)) {
    this._document.insertLines(lineCount, [ "];" ]);
  }
};

Editor.prototype.format = function(Rules) {
  this._editor.setValue(Rules.format(this._editor.getValue()), -1);
};
