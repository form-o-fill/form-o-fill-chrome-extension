/*global FormFiller, FormExtractor, Errors, JSONF, jQuery, Utils*/

// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  Utils.log("Got a connection from " + port.name);
  if(port.name != "FormOFill") {
    return;
  }
  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Utils.log("Filling " + message.selector + " with value " + JSONF.stringify(message.value));
      FormFiller.fill(message.selector, message.value);
    }
  });
});

