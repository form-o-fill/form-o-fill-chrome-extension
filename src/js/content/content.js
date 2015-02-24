/*global FormFiller, JSONF, jQuery, Logger, Utils, Libs */
/*eslint complexity:0 */

// A list of already injected scripts
var injectedScripts = [];

// Script for injecting other scripts into the
// content page.
//
// When using resources from the extension,
// those resources must be included in "web_accessible_resources"
// in the manifest.json
// See http://stackoverflow.com/a/9517879
var injectIntervals = {};

var injectCheck = function(resolve, pathToScript, onWindow) {
  return function innerInjectCheck() {
    // Check if the object on window exists
    if(typeof window[onWindow] !== "undefined") {
      Logger.info("[content.js] Did find window." + onWindow);
      // clear own interval
      clearInterval(injectIntervals[pathToScript]);
      resolve(pathToScript);
    } else {
      Logger.info("[content.js] Did not find window." + onWindow);
    }
  };
};

var checker = function() {
  if(typeof window.chance !== "undefined") {
    console.log("window.chance found!");
    clearInterval(injectIntervals.chance);
  } else {
    console.log("window.chance not found!");
  }
};

var injectScriptTag = function(pathToScript, onWindow) {
  Logger.info("[content.js] Injecting '" + pathToScript + "' into content page (success if window." + onWindow + " exists");
  return new Promise(function (resolve) {
    // Already loaded? return
    if(injectedScripts.indexOf(pathToScript) !== -1) {
      resolve(pathToScript);
    }

    var s = document.createElement("script");
    s.onload = function injectScriptOnLoadCb() {
      Logger.info("[content.js] Injected '" + pathToScript + "' into content page");
      injectedScripts.push(pathToScript);
      this.parentNode.removeChild(this);
      resolve(pathToScript);

      // Check if the object that the library exports is present
      // the injectCheck function clears its own interval
      //injectIntervals[pathToScript] = setInterval(injectCheck(resolve, pathToScript, onWindow), 500);
      //injectIntervals[pathToScript] = setInterval(checker, 1000);
    };
    s.src = chrome.extension.getURL(pathToScript);
    document.head.appendChild(s);
  });
};

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
    jQuery("#" + workingOverlayId).remove();
    clearTimeout(workingTimeout);
    clearTimeout(takingLongTimeout);
    clearTimeout(wontFinishTimeout);
    clearTimeout(displayTimeout);
  };

  // Shows and hides a customized overlay throbber
  var showOverlay = function(message) {
    hideOverlay();
    jQuery("body").find("#" + workingOverlayId).remove().end().append(overlayHtml(message, true));
    displayTimeout = setTimeout(hideOverlay, 1500);
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
    // This should only be triggered for the default "WORKING"
    // overlay.
    // For the customized Lib.halt() message see down below
    if (message.action === "showOverlay" && typeof message.message === "undefined") {
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
      showOverlay(message.message);
    }

    // Inject a script into the page
    if(message.action === "injectScripts" && typeof message.message !== "undefined" && typeof message.message.length === "number") {
      message.message.forEach(function forEachCb(libUrl) {
        injectScriptTag(libUrl, Utils.vendoredLibs[libUrl].onWindowName).then(function prInjScriptTag(path) {
          //injectIntervals[path] = setInterval(checker, 1000);
          setTimeout(function() {
            var lib = Utils.vendoredLibs[path];
            Libs.add(lib.name, window[lib.onWindowName]);
            console.log(lib);
          }, 2000);
        });
      });
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

    // Show a custom message
    // This appears twice in c/content.js because it uses a port and a one-shot
    // listener
    if(message.action === "showOverlay" && typeof message.message !== "undefined") {
      showOverlay(message.message);
      responseCb();
    }

    // Must return true to signal chrome that we do some work
    // asynchronously (see https://developer.chrome.com/extensions/runtime#event-onMessage)
    return true;
  });

});

