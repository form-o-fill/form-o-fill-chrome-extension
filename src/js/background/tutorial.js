/*global Rules lastActiveTab onTabReadyRules Logger Utils Storage Workflows */
/*eslint no-undef:0 no-unused-vars:0 */

// Handler for receiving messages from defined
// webpages (see manifest.json -> externally_connectable).
// This sets the active tutorial ID
var activeTutorialNumber = null;
var didBackup = false;

// Handler for request from the tutorial site
var externalMessageListener = function(request, sender) {

  var isValidMessageSourceForTutorial = function(msgSender) {
    if(/tutorial\/tour-[0-9]+\.html$/.test(msgSender.url) || /^chrome-extension:.*options\.html$/.test(msgSender.url)) {
      return true;
    }
    return false;
  };

  if(!isValidMessageSourceForTutorial(sender) || typeof lastActiveTab.id === "undefined") {
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
    Logger.info("[bg/tutorial.js] Importing rules from webpage");
    Rules.importAll(request.message);
    onTabReadyRules(lastActiveTab.id);
    return;
  }

  // backup rules
  if(request.action === "backupCurrentRules" && !didBackup) {
    Logger.info("[bg/tutorial.js] Backing up current rules");
    Promise.all([Workflows.exportDataJson(), Rules.exportDataJson()]).then(function(workflowsAndRules) {
      var exportJson = {
        workflows: workflowsAndRules[0],
        rules: workflowsAndRules[1]
      };
      didBackup = true;
      Storage.save(exportJson, Utils.keys.tutorialDataBackup);
    });

    return;
  }
};
chrome.runtime.onMessageExternal.addListener(externalMessageListener);

// Also called from options/tutorials.js
chrome.runtime.onMessage.addListener(externalMessageListener);

// handler for receiving tutorials related information from the options.js
var internalMessageListener = function(message, sender, responseCb) {
  // Send active tutorial number to options.js
  if(message.action === "getTutorialOnOpenOptions") {
    responseCb(activeTutorialNumber || 0);
  }

  // Reset state
  if(message.action === "resetTutorialState") {
    didBackup = false;
    activeTutorialNumber = 0;
  }
};
chrome.runtime.onMessage.addListener(internalMessageListener);
