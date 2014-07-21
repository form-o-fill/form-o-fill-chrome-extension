/* global extractRules */
var lastRightClickedElement = null;
document.addEventListener("mousedown", function(event){
  // right click
  if(event.button == 2 && typeof event.target.form !== "undefined") {
    lastRightClickedElement = event.target;
  }
}, true);

// When we receive the message to extract a form
// from bg.js we can just extract the form from the last saved element
chrome.extension.onMessage.addListener(function(message) {
  if(message.action == "extractLastClickedForm") {
    extractRules(lastRightClickedElement.form);
  }
});
