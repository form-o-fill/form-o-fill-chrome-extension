/*global FormFiller, FormExtractor, FormErrors, JSONF, jQuery, Log, Utils*/

// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  var errors = [];
  var currentError = null;

  Log.log("Got a connection from " + port.name);

  if(port.name != "FormOFill") {
    return;
  }

  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Log.log("[content.js] Filling " + message.selector + " with value " + JSONF.stringify(message.value));
      // BUILD: remove start
      if (message.beforeData && message.beforeData !== null) {
        Log.log("[content.js] Also got beforeData = " + JSONF.stringify(message.beforeData));
      }
      // BUILD: remove end
      currentError = FormFiller.fill(message.selector, message.value, message.beforeData);
      if(currentError !== null) {
        Log.log("[content.js] Got error " + JSONF.stringify(currentError));
        errors.push(currentError);
      }
    }

    // request to return all accumulated errors
    if (message.action === "getErrors") {
      Log.log("[content.js] Returning " + errors.length + " errors to bg.js");
      var response = {
        "action": "getErrors",
        "errors": JSONF.stringify(errors)
      };
      port.postMessage(response);
    }
  });
});

