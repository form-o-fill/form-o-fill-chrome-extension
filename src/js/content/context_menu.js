import * as Extractor from "./extract_instrumentation";

var lastRightClickedElement = null;

var ContextMenu = {
  init: function() {
    document.addEventListener("mousedown", function(event){
      // right click
      if(event.button === 2 && typeof event.target.form !== "undefined") {
        lastRightClickedElement = event.target;
      }
    }, true);

    // When we receive the message to extract a form
    // from bg.js we can just extract the form from the last saved element
    chrome.extension.onMessage.addListener(function(message) {
      if(message.action === "extractLastClickedForm") {
        Extractor.extractRules(lastRightClickedElement.form);
      }
    });
  }
};

module.exports = ContextMenu;

