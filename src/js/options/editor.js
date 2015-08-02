/*global ace*/
var Editor = function(selector) {
  this._resizeTimeout = null;

  // Resize the editor DIV to max
  this.resize();
  window.addEventListener("resize", this._resizeThrottler(this), false);

  this._editor = ace.edit(document.querySelector(selector));
  this._session = this._editor.getSession();
  this._document = this._session.getDocument();
  this._editor.setTheme("ace/theme/clouds");
  this._editor.setAutoScrollEditorIntoView(true);
  this._editor.$blockScrolling = Infinity;
  this._session.setMode("ace/mode/javascript");
  this._session.setTabSize(2);
  this._session.setUseSoftTabs(true);
  this._session.setUseSoftTabs(true);
  this._markers = [];
};

Editor.prototype.range = function(startRow, endRow) {
  var Range = ace.require('ace/range').Range;
  return new Range(startRow, 0, endRow, 255);
};

Editor.prototype.removeAllMarkers = function() {
  var editor = this;
  this._markers.forEach(function (markerId) {
    editor._session.removeMarker(markerId);
  });
  this._markers = [];
  var nl = document.querySelectorAll(".ace_highlight-line");
  var l = nl.length;
  while (l--) {
    nl[l].classList.remove("ace_highlight-line");
  }

  return this;
};

// Sets a marker inside the rule editor
// This gets highlighted via CSS and is used for tutorials
Editor.prototype.setMarker = function(startLine, endLine) {
  this.removeAllMarkers();
  var marker = this.range(startLine - 1, endLine - 1);
  var markerId = this._session.addMarker(marker, "ace_active-line ace_highlight-line", "fullLine");
  this._markers.push(markerId);
  return this;
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
      this._document.removeFullLines(i, i);
    } else {
      break;
    }
  }
  return true;
};

// Format the rules
Editor.prototype.format = function(Rules) {
  this._editor.setValue(Rules.format(this._editor.getValue()), -1);
};

// redraw the editor
Editor.prototype.redraw = function() {
  if(typeof this._editor !== "undefined") {
    this._editor.resize();
  }
};

// resize the editor DOM to a max size
Editor.prototype.resize = function() {
  var $ruleEditor = document.querySelector("#ruleeditor");
  var $tabContainer = document.querySelector(".tabcontainer");
  var $menu = document.querySelector(".menu");
  var $header = document.querySelector("header");

  var maxEditorHeight = $ruleEditor.clientHeight - $tabContainer.clientHeight - $menu.clientHeight - $header.clientHeight + 40;
  document.querySelector("#ruleeditor-ace").setAttribute("style", "height: " + maxEditorHeight + "px");
};

// Throttle the resize down so the screen doesn't flicker
// One resize per 200 ms
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
