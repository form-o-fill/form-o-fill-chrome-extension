/*eslint no-undef:0 no-unused-vars:0 */

// Handler for receiving messages from defined
// webpages (see manifest.json -> externally_connectable).
// This sets the active tutorial ID
var activeTutorialNumber = null;

var externalMessageListener = function(request, sender) {
  if(!/tutorial\/tour-[0-9]+\.html$/.test(sender.url)) {
    return;
  }

  // On tutorial site!
  if(request.action === "activateTutorialOnOpenOptions") {
    // remember active tutorial
    activeTutorialNumber = parseInt(request.message, 10);
  }


  // request from tutorials site
  // to import rules
  if(request.action === "importDump" && request.message !== "") {
    // remember active tutorial
    activeTutorialNumber = parseInt(request.message, 10);
  }
};
chrome.runtime.onMessageExternal.addListener(externalMessageListener);

// handler for receiving tutorials related information from the background.js
var internalMessageListener = function(message, sender, responseCb) {
  // Send active tutorial number to options.js
  if(message.action === "getTutorialOnOpenOptions") {
    responseCb(activeTutorialNumber || 0);
  }
};
chrome.runtime.onMessage.addListener(internalMessageListener);
