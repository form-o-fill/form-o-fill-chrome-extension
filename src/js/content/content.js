/*global FormFiller, Errors*/
// This listens for messages comming from the background page/js
chrome.runtime.onConnect.addListener(function (port) {
  console.log("Got a connection from " + port.name);
  if(port.name != "FormOFill") {
    return;
  }
  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      console.log("Filling " + message.selector + " with value " + message.value);
      FormFiller.fill(message.selector, message.value);
      console.log(Errors.errors);
    }
  });
});

