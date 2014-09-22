/*global ace*/
var Editor = function(selector) {
  this._resizeTimeout = null;

  // Resize the editor DIV to max
  this.resize();
  window.addEventListener("resize", this._resizeThrottler(this), false);

  this._editor = ace.edit(document.querySelector(selector));
  this._session = this._editor.getSession();
  this._document = this._session.getDocument();
  this._editor.setTheme("ace/theme/jsoneditor");
  this._editor.setAutoScrollEditorIntoView(true);
  this._session.setMode("ace/mode/javascript");
  this._session.setTabSize(2);
  this._session.setUseSoftTabs(true);
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
  var i;
  for(i = lastLineIndex; i > 0; i--) {
    line = this._document.getLine(i).trim();
    if(line === "") {
      this._document.removeLines(i,i);
    } else {
      break;
    }
  }
  return true;
};

// Fix broken rules in editor
// ATTENTION! This is broken at the moment
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

// Format the rules
Editor.prototype.format = function(Rules) {
  this._editor.setValue(Rules.format(this._editor.getValue()), -1);
};

// resize the editor DOM to a max size
Editor.prototype.resize = function() {
  var maxEditorHeight = document.querySelector("#ruleeditor").clientHeight - document.querySelector(".tabcontainer").clientHeight - document.querySelector(".menu").clientHeight - document.querySelector("header").clientHeight + 40;
  var editorDomNode = document.querySelector("#ruleeditor-ace");
  editorDomNode.setAttribute("style", "height: " + maxEditorHeight + "px");
};

// Throttle the resize down so the screen doesn't flicker
Editor.prototype._resizeThrottler = function(editor) {
  return function() {
    if(!editor._resizeTimeout) {
      editor._resizeTimeout = setTimeout(function() {
        editor._resizeTimeout = null;
        editor.resize();
       }, 200);
    }
  };
};
