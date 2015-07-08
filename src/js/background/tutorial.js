/*global Rules lastActiveTab onTabReadyRules Logger Utils Storage Workflows */
/*eslint no-undef:0 no-unused-vars:0 */

// Handler for receiving messages from defined
// webpages (see manifest.json -> externally_connectable).
// This sets the active tutorial ID
var didBackup = false;

var Tutorial = Tutorial || {};

Tutorial.isValidMessageSourceForTutorial = function (msgSender) {
  if(/tutorial\/tour-[0-9]+\.html$/.test(msgSender.url) || /^chrome-extension:.*options\.html$/.test(msgSender.url)) {
    return true;
  }
  return false;
};

Tutorial.setActiveTutorial = function(tutorianNumber) {
  window.sessionStorage.setItem("activeTutorialNumber", tutorianNumber);
};

Tutorial.getActiveTutorial = function() {
  return parseInt(window.sessionStorage.getItem("activeTutorialNumber"), 10);
};

Tutorial.activateTutorialOnOpenOptionsHandler = function(request) {
  // remember active tutorial
  var activeTutorialNumber = parseInt(request.message, 10);
  Tutorial.setActiveTutorial(activeTutorialNumber);
  Logger.info("[bg/tutorial.js] Setting activeTutorialNumber = " + activeTutorialNumber);
};

Tutorial.importDumpHandler = function(request) {
  // Import the dump
  Logger.info("[bg/tutorial.js] Importing rules from webpage");
  Rules.importAll(request.message).then(function() {
    onTabReadyRules(lastActiveTab.id);
  });
};

Tutorial.backupCurrentRulesHandler = function() {
  Promise.all([Workflows.exportDataJson(), Rules.exportDataJson()]).then(function(workflowsAndRules) {
    var exportJson = {
      workflows: workflowsAndRules[0],
      rules: workflowsAndRules[1]
    };
    Logger.info("[bg/tutorial.js] Backing up current rules (" + workflowsAndRules[1].length + ") and workflows (" + workflowsAndRules[0] + ")");
    didBackup = true;
    Storage.save(exportJson, Utils.keys.tutorialDataBackup);
  });
};


Tutorial.restoreBackedUpRulesHandler = function() {
  Storage.load(Utils.keys.tutorialDataBackup)
  .then(Rules.importAll);
  // TODO send to options -> reload!
};

// Handler for request from the tutorial site
/*eslint-disable complexity*/
var tutorialMessagesListener = function tutorialMessagesListener(request, sender, responseCb) {
  if(!Tutorial.isValidMessageSourceForTutorial(sender) || lastActiveTab === null) {
    return;
  }

  // Activate a tutorial when the user opens the options
  // panel
  if(request.action === "activateTutorialOnOpenOptions") {
    didBackup = false;
    Tutorial.activateTutorialOnOpenOptionsHandler(request);
  }

  // Import Rules and Wfs
  if(request.action === "importDump" && request.message !== "") {
    Tutorial.importDumpHandler(request);
  }

  // backup rules
  if(request.action === "backupCurrentRules" && !didBackup) {
    Tutorial.backupCurrentRulesHandler();
  }
};

/*eslint-enable complexity*/
chrome.runtime.onMessageExternal.addListener(tutorialMessagesListener);

// Also called from options/tutorials.js
chrome.runtime.onMessage.addListener(tutorialMessagesListener);

// handler for receiving tutorials related information from the options.js
var internalMessageListener = function(message, sender, responseCb) {
  // Send active tutorial number to options.js
  if(message.action === "getTutorialOnOpenOptions") {
    responseCb(Tutorial.getActiveTutorial() || 0);
  }

  // Reset state
  if(message.action === "resetTutorialState") {
    Tutorial.restoreBackedUpRulesHandler();
    didBackup = false;
    Tutorial.setActiveTutorial(0);
    responseCb();
  }
};
chrome.runtime.onMessage.addListener(internalMessageListener);
