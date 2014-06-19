var FunctionBlockFinder = function(editorSession) {
  this.editorSession = editorSession;
};

FunctionBlockFinder.prototype.findFromRow = function (startRowBaseZero) {
  var bracketsLevel = 0;
  var line = null;
  var lineCount = this.editorSession.getLength();
  var lineNr;

  for(lineNr = startRowBaseZero; lineNr < lineCount && (!line || bracketsLevel > 0); lineNr++) {
    line = this.editorSession.getLine(lineNr);
    if(line.indexOf("{") > -1) {
      bracketsLevel++;
    }
    if(line.indexOf("}") > -1) {
      bracketsLevel--;
    }
  }
  return { "start" : startRowBaseZero + 1, "end" : lineNr};
};
