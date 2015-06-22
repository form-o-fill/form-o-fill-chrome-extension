/*global Rules lastActiveTab onTabReadyRules Logger */
/*eslint no-undef:0 no-unused-vars:0 */

// Handler for receiving messages from defined
// webpages (see manifest.json -> externally_connectable).
// This sets the active tutorial ID
var activeTutorialNumber = null;

// Handler for request from the tutorial site
var externalMessageListener = function(request, sender) {
  if(!/tutorial\/tour-[0-9]+\.html$/.test(sender.url) || typeof lastActiveTab.id === "undefined" || !/^chrome-extension:.*options\.html$/.test(sender.url)) {
    return;
  }

  // Activate a tutorial when the user opens the options
  // panel
  if(request.action === "activateTutorialOnOpenOptions") {
    // remember active tutorial
    activeTutorialNumber = parseInt(request.message, 10);
    Logger.info("[bg/tutorial.js] Setting activeTutorialNumber = " + activeTutorialNumber);
    return;
  }

  // Import Rules and Wfs
  if(request.action === "importDump" && request.message !== "") {
    // Import the dump
    Rules.importAll(request.message);
    onTabReadyRules(lastActiveTab.id);
    return;
  }
};
chrome.runtime.onMessageExternal.addListener(externalMessageListener);

// Also called from options/tutorials.js
chrome.runtime.onMessage.addListener(externalMessageListener);

// handler for receiving tutorials related information from the background.js
var internalMessageListener = function(message, sender, responseCb) {
  // Send active tutorial number to options.js
  if(message.action === "getTutorialOnOpenOptions") {
    responseCb(activeTutorialNumber || 0);
  }
};
chrome.runtime.onMessage.addListener(internalMessageListener);
