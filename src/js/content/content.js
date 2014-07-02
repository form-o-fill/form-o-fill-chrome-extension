/*global FormFiller, FormExtractor, FormErrors, JSONF, jQuery, Logger, Utils*/

// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  var errors = [];
  var currentError = null;

  Logger.info("[content.js] Got a connection from " + port.name, port);

  if(port.name != "FormOFill") {
    return;
  }

  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Logger.info("[content.js] Filling " + message.selector + " with value " + JSONF.stringify(message.value), port);
      // BUILD: remove start
      if (message.beforeData && message.beforeData !== null) {
        Logger.info("[content.js] Also got beforeData = " + JSONF.stringify(message.beforeData), port);
      }
      // BUILD: remove end
      currentError = FormFiller.fill(message.selector, message.value, message.beforeData);
      if(currentError !== null) {
        Logger.info("[content.js] Got error " + JSONF.stringify(currentError), port);
        errors.push(currentError);
      }
    }

    // request to return all accumulated errors
    if (message.action === "getErrors") {
      Logger.info("[content.js] Returning " + errors.length + " errors to bg.js");
      var response = {
        "action": "getErrors",
        "errors": JSONF.stringify(errors)
      };
      port.postMessage(response);
    }
  });
});

