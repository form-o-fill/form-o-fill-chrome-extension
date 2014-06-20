/*global FormFiller, FormExtractor, Errors, JSONF, jQuery*/

// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  console.log("Got a connection from " + port.name);
  if(port.name != "FormOFill") {
    return;
  }
  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      console.log("Filling " + message.selector + " with value " + JSONF.stringify(message.value));
      FormFiller.fill(message.selector, message.value);
    }
  });
});

