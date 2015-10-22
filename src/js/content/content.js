/*global FormFiller, JSONF, jQuery, Logger, Libs */
/*eslint complexity:0 */
import * as Overlay from "./overlay";

Overlay.init();

chrome.runtime.onConnect.addListener(function (port) {
  var errors = [];
  var currentError = null;

  Logger.info("[content.js] Got a connection from " + port.name);

  if(port.name !== "FormOFill") {
    return;
  }

  port.onMessage.addListener(function (message) {
    Logger.info("[content.js] Got message via port.onMessage : " + JSONF.stringify(message) + " from bg.js");

    // Request to fill one field with a value
    if (message.action === "fillField" && message.selector && message.value) {
      Logger.info("[content.js] Filling " + message.selector + " with value " + JSONF.stringify(message.value) + "; flags : " + JSONF.stringify(message.flags));

      // REMOVE START
      if (message.beforeData && message.beforeData !== null) {
        Logger.info("[content.js] Also got beforeData = " + JSONF.stringify(message.beforeData));
      }
      // REMOVE END

      currentError = FormFiller.fill(message.selector, message.value, message.beforeData, message.flags, message.meta);

      // Remember the error
      if(typeof currentError !== "undefined" && currentError !== null) {
        Logger.info("[content.js] Got error " + JSONF.stringify(currentError));
        errors.push(currentError);
      }

      // Send a message that we are done filling the form
      if(message.meta.lastField) {
        Logger.info("[content.js] Sending fillFieldFinished since we are done with the last field definition");

        chrome.runtime.sendMessage({
          "action": "fillFieldFinished",
          "errors": JSONF.stringify(errors)
        });
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

    // reload the libraries
    if(message.action === "reloadLibs") {
      Libs.import();
    }

    // execute setupContent function
    if(message.action === "setupContent" && message.value) {
      Logger.info("[content.js] Executing setupContent function", message.value);

      // Parse and execute function
      var error = null;

      try {
        JSONF.parse(message.value)();
      } catch (e) {
        Logger.error("[content.js] error while executing setupContent function");
        error = e.message;
      }

      port.postMessage({action: "setupContentDone", value: JSONF.stringify(error)});
    }

    // execute teardownContent function
    // It has jQuery available and the context object from value functions and setupContent
    if(message.action === "teardownContent" && message.value) {
      Logger.info("[content.js] Executing teardownContent function", message.value);

      try {
        JSONF.parse(message.value)();
      } catch (e) {
        Logger.error("[content.js] error while executing teardownContent function");
      }
    }
  });

  // Simple one-shot callbacks
  chrome.runtime.onMessage.addListener(function (message, sender, responseCb) {
    Logger.info("[content.js] Got message via runtime.onMessage : " + JSONF.stringify(message) + " from bg.j");

    // This is the content grabber available as context.findHtml() in before functions
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

    // Save a variable set in background via storage.set in the context of the content script
    // This makes the storage usable in value functions
    if(message.action === "storageSet" && typeof message.key !== "undefined" && typeof message.value !== "undefined") {
      Logger.info("[content.js] Saving " + message.key + " = " + message.value);
      window.sessionStorage.setItem(message.key, message.value);
    }

    // Must return true to signal chrome that we do some work
    // asynchronously (see https://developer.chrome.com/extensions/runtime#event-onMessage)
    return true;
  });

});

