/*global FormFiller, JSONF, jQuery, Logger*/
/*eslint complexity:0 */

// This listens for messages coming from the background page
// This is a long running communication channel
chrome.runtime.onConnect.addListener(function (port) {
  var errors = [];
  var currentError = null;
  var workingOverlayId = "form-o-fill-working-overlay";

  var workingTimeout = null;
  var takingLongTimeout = null;
  var wontFinishTimeout = null;
  var displayTimeout = null;

  Logger.info("[content.js] Got a connection from " + port.name);

  if(port.name != "FormOFill") {
    return;
  }

  var overlayHtml = function(text, isVisible) {
    if(typeof text === "undefined") {
      text = "Form-O-Fill is working, please wait!";
    }

    if(typeof isVisible === "undefined") {
      isVisible = false;
    }
    return "<div id='" + workingOverlayId + "' style='display: " + (isVisible ? "block" : "none") + ";'>" + text + "</div>";
  };

  // Hide overlay and cancel all timers
  var hideOverlay = function() {
    jQuery("#" + workingOverlayId).hide();
    clearTimeout(workingTimeout);
    clearTimeout(takingLongTimeout);
    clearTimeout(wontFinishTimeout);
    clearTimeout(displayTimeout);
  };

  port.onMessage.addListener(function (message) {
    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Logger.info("[content.js] Filling " + message.selector + " with value " + JSONF.stringify(message.value));
      // REMOVE START
      if (message.beforeData && message.beforeData !== null) {
        Logger.info("[content.js] Also got beforeData = " + JSONF.stringify(message.beforeData));
      }
      // REMOVE END
      currentError = FormFiller.fill(message.selector, message.value, message.beforeData);
      if(typeof currentError !== "undefined" && currentError !== null) {
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
    if (message.action === "showOverlay") {
      Logger.info("[content.js] Showing working overlay");
      if(document.querySelectorAll("#" + workingOverlayId).length === 0) {
        jQuery("body").append(overlayHtml());
      }

      // Show working overlay after some time
      workingTimeout = setTimeout(function() {
        jQuery("#" + workingOverlayId).show();
      }, 350);

      // Show another overlay when things take REALLY long to finishs
      takingLongTimeout = setTimeout(function () {
        jQuery("#" + workingOverlayId).html("This is really taking too long.");
      }, 5000);

      // Finally if everything fails, clear overlay after 10 seconds
      wontFinishTimeout = setTimeout(hideOverlay, 12000);
    }

    // Hide the overlay
    if (message.action === "hideWorkingOverlay") {
      Logger.info("[content.js] Hiding working overlay");
      hideOverlay();
    }

    // Show a custom message
    if(message.action === "showMessage") {
      jQuery("body").find("#" + workingOverlayId).remove().end().append(overlayHtml(message.message, true));
      displayTimeout = setTimeout(hideOverlay, 1500);
    }
  });

  // Simple one-shot callbacks
  // This is the content grabber available as context.findHtml() in before functions
  chrome.runtime.onMessage.addListener(function (message, sender, responseCb) {
    if (message.action === "grabContentBySelector") {
      Logger.info("[content.js] Grabber asked for '" + message.message + "'");
      var domElements = jQuery(message.message).map(function (index, $el) {
        return $el;
      });
      if(domElements.length === 0) {
        responseCb([]);
      } else if(domElements.length === 1) {
        responseCb(domElements[0].outerHTML);
      } else {
        responseCb(domElements.map(function(el) {
          return el.outerHTML;
        }));
      }
    }
  });

});

