/*global state Utils */
var Screenshooter = function() {
};

Screenshooter.prototype.generateFilename = function(metadata) {
  var ruleNameAsFilename = metadata.name.replace(/[^a-z0-9-_]/gi, '_') + ".jpg";
  return "fof-screenshot-" + metadata.ruleId.replace(/([0-9]+)-([0-9]+)/, "tab-$1-rule-$2-field-") + metadata.fieldIndex + "_" + ruleNameAsFilename;
};

// Takes screenshot of a window
// and downloads it to disk
Screenshooter.prototype.takeScreenshot = function(windowId, ruleMetadata, potentialFilename) {
  var quality = parseInt(state.optionSettings.jpegQuality, 10) || 60;
  var fName;

  // force download of the image
  if (typeof potentialFilename === "string") {
    // use user defined name
    fName = potentialFilename.replace(/[^a-z0-9-_]/gi, '_') + ".jpg";
  } else if (ruleMetadata) {
    // use generated name
    fName = this.generateFilename(ruleMetadata);
  } else {
    return;
  }

  chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: quality}, function(screenshotDataUri) {
    Utils.downloadImage(screenshotDataUri, fName);
  });
};
