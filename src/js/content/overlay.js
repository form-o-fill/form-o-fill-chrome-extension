import jQuery from "jquery";
import Logger from "../debug/logger";

var workingOverlayId = "form-o-fill-working-overlay";
var workingTimeout = null;
var takingLongTimeout = null;
var wontFinishTimeout = null;
var displayTimeout = null;

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

// This listens for messages coming from the background page
// This is a long running communication channel
var portListener = function() {
  chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener(function (message) {
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

        // Show another overlay when things take REALLY long to finish
        takingLongTimeout = setTimeout(function () {
          jQuery("#" + workingOverlayId).html("This is really taking too long.");
        }, 5000);

        // Finally if everything fails, clear overlay after 12 seconds
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
    });
  });
};

var runtimeListener = function() {
  chrome.runtime.onMessage.addListener(function (message, sender, responseCb) {
    // Show a custom message
    // This appears twice in c/content.js because it uses a port and a one-shot
    // listener
    if(message.action === "showOverlay" && typeof message.message !== "undefined") {
      showOverlay(message.message);
      responseCb();
    }
  });
};

var init = function() {
  runtimeListener();
  portListener();
};

module.exports = {
  overlayHtml: overlayHtml,
  hideOverlay: hideOverlay,
  showOverlay: showOverlay,
  init: init
};
