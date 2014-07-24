/*global FormFiller, FormExtractor, FormErrors, JSONF, jQuery, Logger, Utils*/
/*eslint complexity:0 */
// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  var errors = [];
  var currentError = null;
  var workingOverlayId = "form-o-fill-working-overlay";
  var workingOverlayHtml = "<div id='" + workingOverlayId + "'>Form-O-Fill is working, please wait!</div>";

  Logger.info("[content.js] Got a connection from " + port.name);

  if(port.name != "FormOFill") {
    return;
  }

  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Logger.info("[content.js] Filling " + message.selector + " with value " + JSONF.stringify(message.value));
      // BUILD: remove start
      if (message.beforeData && message.beforeData !== null) {
        Logger.info("[content.js] Also got beforeData = " + JSONF.stringify(message.beforeData));
      }
      // BUILD: remove end
      currentError = FormFiller.fill(message.selector, message.value, message.beforeData);
      if(currentError !== null) {
        Logger.info("[content.js] Got error " + JSONF.stringify(currentError));
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

    // Show Working overlay
    if (message.action === "showWorkingOverlay") {
      Logger.info("[content.js] Showing working overlay");
      if(document.querySelectorAll("#" + workingOverlayId).length === 0) {
        jQuery("body").append(workingOverlayHtml);
      }
      jQuery("#" + workingOverlayId).show();
    }

    if (message.action === "hideWorkingOverlay") {
      Logger.info("[content.js] Hiding working overlay");
      jQuery("#" + workingOverlayId).hide();
    }
  });
});

