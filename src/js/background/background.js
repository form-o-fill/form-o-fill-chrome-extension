/* eslint complexity:0, max-nested-callbacks: [1,5] */
import * as state from "../global/state";
import * as Logger from "../debug/logger";
import * as Alarm from "./alarm";
import * as Utils from "../global/utils";
import * as Workflows from "../global/workflows";
import * as ContextMenu from "./context_menu";
import * as JSONF from "../global/jsonf";
import * as Storage from "../global/storage";
import * as Rules from "../global/rules";
import * as Libs from "../global/libs";
import * as RemoteImport from "./remote_import";
import * as Testing from "./testing";
import * as Notification from "./notification";
import * as FormUtil from "./form_util";

var lastMatchingRules = [];
var totalMatchesCount = 0;
var runWorkflowOrRule;
var recheckInterval = null;

var defaultBadgeBgColor = [0, 136, 255, 200];
var intervalBadgeBgColor = [43, 206, 7, 255];
var useBadgeBgColor = defaultBadgeBgColor;

// set the browser action badge
var setBadge = function(txt, tabId) {
  chrome.browserAction.setBadgeText({"text": txt, "tabId": tabId});
  chrome.browserAction.setBadgeBackgroundColor({"color": useBadgeBgColor, "tabId": tabId});

  Testing.setVar("browser-action-badge-text", txt, "Browser action badge text");
};

// Shows number of matches in the extension's icon
var refreshMatchCounter = function (tab, count) {
  var txt = chrome.i18n.getMessage("no_match_available");
  if (count && count > 0) {
    txt = count.toString();
  }
  setBadge(txt, tab.id);
};

// Testcode: Fill testing HTML with macthing rules
var reportMatchingRulesForTesting = function(matchingRules, lastMatchingWorkflows) {
  /*eslint-disable max-nested-callbacks*/
  var mRule = matchingRules.map(function (rule) {
    return rule.prettyPrint();
  }).join(",");
  /*eslint-enable max-nested-callbacks*/
  Testing.setVar("matching-rules-count", matchingRules.length, "Matching rule #");
  Testing.setVar("matching-rules-text", "[" + mRule + "]", "Matching rules JSON");
  Testing.setVar("settings", JSONF.stringify(state.optionSettings), "Current settings");

  // If there is only one match we need something in the testpage to click on
  if(matchingRules.length + lastMatchingWorkflows.length === 1) {
    Testing.setVar("popup-html", "<li class='select-rule' data-rule-name='" + matchingRules[0].name.replace(/[^a-zA-Z-]/g, "-").toLowerCase() + "'>" + matchingRules[0].name + "</li>", "Popup HTML (one match)");
  }
};

// When the user changes a tab, search for matching rules for that url
// or matching rules for that content
var onTabReadyRules = function(tabId) {
  lastMatchingRules = [];

  // Clear popup HTML
  chrome.browserAction.setPopup({"tabId": tabId, "popup": ""});
  Logger.info("[bg.js] onTabReadyRules on Tab " + tabId);

  chrome.tabs.get(tabId, function(tab) {

    // return if the tab isn't active anymore
    if (chrome.runtime.lastError || !tab.active || tab.url.indexOf("chrome") === 0) {
      return;
    }

    state.lastActiveTab = tab;
    Logger.info("[bg.js] Setting active tab", tab);

    // This is a little bit complicated.
    // I wish the chromium API would implement Promises for all that.
    Rules.all().then(function (rules) {

      // This happens only on the very first install:
      if(rules.length === 0) {
        // No rules present!
        Promise.all([Rules.lastMatchingRules([]), Workflows.saveMatches([])]).then(function() {
          chrome.browserAction.setPopup({"tabId": tab.id, "popup": "html/popup.html"});
          refreshMatchCounter(0);
          return;
        });
      }

      // First filter all rules that have content matchers
      var relevantRules = rules.filter(function (rule) {
        return typeof rule.content !== "undefined";
      });

      // Send these rules to the content script so it can return the matching
      // rules based on the regex and the pages content
      var message = { "action": "matchContent", "rules": JSONF.stringify(relevantRules)};
      chrome.tabs.sendMessage(tabId, message, function (matchingContentRulesIds) {
        var matchingContentRules = [];

        // If we found rules that match by content ...
        if(typeof matchingContentRulesIds !== "undefined") {
          // ... select rules that match those ids
          matchingContentRulesIds = JSONF.parse(matchingContentRulesIds);
          if(typeof matchingContentRulesIds !== "undefined" && matchingContentRulesIds.length > 0) {
            matchingContentRules = rules.filter(function (rule) {
              return matchingContentRulesIds.indexOf(rule.id) > -1;
            });

            // Add the rules to the rule that matches by url
            lastMatchingRules = lastMatchingRules.concat(matchingContentRules);
          }
        }
        Logger.info("[bg.js] Got " + matchingContentRules.length + " rules matching the content of the page");

        // Now match those rules that have a "url" matcher
        Rules.match(tab.url).then(function (matchingRules) {
          Logger.info("[bg.js] Got " + matchingRules.length + " rules matching the url of the page");

          // Concatenate matched rules by CONTENT and URL
          lastMatchingRules = Rules.unique(lastMatchingRules.concat(matchingRules));

          // Save rules to localStorage for popup to load
          Rules.lastMatchingRules(lastMatchingRules);

          // Now find and save the matching workflows for those rules
          Workflows.matchesForRules(lastMatchingRules).then(function prMatchingWfs(matchingWfs) {
            Workflows.saveMatches(matchingWfs);

            // Show matches in badge
            totalMatchesCount = lastMatchingRules.length + matchingWfs.length;
            refreshMatchCounter(tab, totalMatchesCount);

            // TESTING
            if(!Utils.isLiveExtension()) {
              reportMatchingRulesForTesting(lastMatchingRules, matchingWfs);
            }

            // No matches? Multiple Matches? Show popup when the user clicks on the icon
            // A single match should just fill the form (see below)
            if (totalMatchesCount !== 1 || (typeof state.optionSettings !== "undefined" && state.optionSettings.alwaysShowPopup)) {
              chrome.browserAction.setPopup({"tabId": tab.id, "popup": "html/popup.html"});
              if (!Utils.isLiveExtension()) {
                Testing.createCurrentPopupInIframe(tab.id);
              }
            } else if (lastMatchingRules[0].autorun === true) {
              // If the rule is marked as "autorun", execute the rule if only
              // one was found
              Logger.info("[bj.js] Rule is set to autorun");
              FormUtil.applyRule(lastMatchingRules[0]);
            }
          });
        });

      });
    });
  });
};

// Load running workflow storage
// and run the next step
var onTabReadyWorkflow = function() {
  return new Promise(function (resolve) {
    Storage.load(Utils.keys.runningWorkflow).then(function prOnTabReadyWf(runningWorkflow) {
      // No running workflow?
      if(typeof runningWorkflow === "undefined" || !state.lastActiveTab) {
        resolve({status: "not_running", runRule: true});
        return;
      }

      // End of workflow reached
      if(runningWorkflow.currentStep >= runningWorkflow.steps.length) {
        FormUtil.displayMessage(chrome.i18n.getMessage("bg_workflow_finished"), state.lastActiveTab);
        Storage.delete(Utils.keys.runningWorkflow);

        // Search for matching rules and workflows
        // to fill the icon again
        runWorkflowOrRule(state.lastActiveTab.id);

        resolve({status: "finished", runRule: false});
        return;
      }

      // load rule for workflow step
      var ruleNameToRun = runningWorkflow.steps[runningWorkflow.currentStep];
      Logger.info("[background.js] Using workflow step # " + (runningWorkflow.currentStep + 1) + " (" + ruleNameToRun + ")");
      setBadge("#" + (runningWorkflow.currentStep + 1), state.lastActiveTab.id);

      Rules.findByName(ruleNameToRun).then(function prExecWfStep(rule) {
        if(typeof rule === "undefined") {
          // report not found rule in options, cancel workflow
          FormUtil.displayMessage(chrome.i18n.getMessage("bg_workflow_error"), state.lastActiveTab);
          Storage.delete(Utils.keys.runningWorkflow);

          // Search for matching rules and workflows
          runWorkflowOrRule(state.lastActiveTab.id);

          resolve({status: "rule_not_found", runRule: false});
        } else {
          // Should a screenshot be taken?
          if(runningWorkflow.flags && runningWorkflow.flags.screenshot === true) {
            Logger.info("[background.js] setting rule.screenshot = true because Wf config said so");
            rule.screenshot = true;
          }

          // Fill with this rule
          FormUtil.displayMessage(chrome.i18n.getMessage("bg_workflow_step", [runningWorkflow.currentStep + 1, runningWorkflow.steps.length]), state.lastActiveTab);
          FormUtil.applyRule(rule);

          // Save workflow state so we can continue even after a page reload
          Storage.save({
            currentStep: runningWorkflow.currentStep + 1,
            steps: runningWorkflow.steps,
            flags: runningWorkflow.flags
          }, Utils.keys.runningWorkflow).then(function () {
            resolve({status: "running_workflow", runRule: false});
          });
        }
      });

      // Running workflow! Don't run normal rules.
      resolve({status: "running_workflow", runRule: false});
    });
  });
};

// Searches for workflows or rules to run
// Workflows steps are then run and subsequent matching rules are ignored
runWorkflowOrRule = function (tabId) {
  // First check (and run) workflows
  return onTabReadyWorkflow().then(function prOnTabReadyWf(workflowStatus) {
    // If a workflow step has been run, don't run rules
    // otherwise do run
    if(workflowStatus.runRule) {
      onTabReadyRules(tabId);
    }
  });
};

// Generates a filename that is safe for disc storage
var generateFilename = function(metadata) {
  var ruleNameAsFilename = metadata.name.replace(/[^a-z0-9-_]/gi, '_') + ".jpg";
  return "fof-screenshot-" + metadata.ruleId.replace(/([0-9]+)-([0-9]+)/, "tab-$1-rule-$2-field-") + metadata.fieldIndex + "_" + ruleNameAsFilename;
};

// Takes screenshot of a window
// and downloads it to disk
var takeScreenshot = function(windowId, ruleMetadata, potentialFilename) {
  var quality = parseInt(state.optionSettings.jpegQuality, 10) || 60;
  var fName;

  // force download of the image
  if(typeof potentialFilename === "string") {
    // use user defined name
    fName = potentialFilename.replace(/[^a-z0-9-_]/gi, '_') + ".jpg";
  } else if(ruleMetadata) {
    // use generated name
    fName = generateFilename(ruleMetadata);
  } else {
    return;
  }

  chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: quality}, function(screenshotDataUri) {
    Utils.downloadImage(screenshotDataUri, fName);
  });
};

// This function manages the interval that is used if
// the user has "reeval-rules" checked in settings.
// It executes the rules matching every two seconds
var setCyclicRulesRecheck = function(shouldCheck) {
  if(recheckInterval) {
    clearInterval(recheckInterval);
    recheckInterval = null; // Collect it
    Logger.info("[bg.js] Deactivate interval for rule rechecking");
    useBadgeBgColor = defaultBadgeBgColor;
  }

  if(shouldCheck) {
    recheckInterval = setInterval(function() {
      if(state.lastActiveTab !== null) {
        runWorkflowOrRule(state.lastActiveTab.id);
      }
    }, Utils.reevalRulesInterval);
    Logger.info("[bg.js] Activate interval for rule rechecking");
    useBadgeBgColor = intervalBadgeBgColor;
  }

  // Set BG color now even if not rematching has been done
  if(state.lastActiveTab !== null) {
    chrome.browserAction.setBadgeBackgroundColor({"color": useBadgeBgColor, "tabId": state.lastActiveTab.id});
  }
};

// Fires when a tab becomes active (https://developer.chrome.com/extensions/tabs#event-onActivated)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  runWorkflowOrRule(activeInfo.tabId);
});

// Fires when the URL changes (https://developer.chrome.com/extensions/tabs#event-onUpdated)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if(changeInfo.status && changeInfo.status === "complete") {
    runWorkflowOrRule(tabId);
  }
});

// This event will only fire if NO POPUP is set
// This is the case when only one rule matches
chrome.browserAction.onClicked.addListener(function (){
  FormUtil.applyRule(lastMatchingRules[0]);
});

// Listen for messages from other background/popup scripts
// Also listens to messages from testcases
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {

  Logger.info("[bj.js] Received message " + JSONF.stringify(message));

  // From popup.js:
  // This receives the index of the rule to apply when there is more than one match
  if (message.action === "fillWithRule") {
    Logger.info("[bg.js] called by popup.js with rule index " + message.index + ", id = " + message.id);
    // Find the rule by id
    var rules = lastMatchingRules.filter(function (rule) {
      return rule.id === message.id;
    });
    FormUtil.applyRule(rules[0]);
    sendResponse(true);
  }

  // From popup.js:
  // Apply a workflow starting at the first step / rule
  if (message.action === "fillWithWorkflow") {
    // Load previously saved matching workflows
    Workflows.findById(message.id).then(function prLoadMatches(matchingWf) {
      // Now save the steps of that workflow to the storage and
      // mark the current running workflow
      Storage.save({ currentStep: 0, steps: matchingWf.steps, flags: matchingWf.flags }, Utils.keys.runningWorkflow).then(function () {
        onTabReadyWorkflow();
      });
    });
    sendResponse(true);
  }

  // Open an intern URL (aka. options).
  // Callable by content script that otherwise isn't allowed to open intern urls.
  if(message.action === "openIntern" && message.url) {
    Logger.info("[bg.js] received 'openIntern' with url '" + message.url + "'");
    chrome.tabs.create({ "active": true, "url": message.url });
  }

  // Display a notification to the user that the extract has finished
  if(message.action === "extractFinishedNotification") {
    Logger.info("[bg.js] received 'extractFinishedNotification'");
    Notification.create(chrome.i18n.getMessage("notification_form_extraction_done"), null, Utils.openOptions);
  }

  // Return the last active tab id
  if(message.action === "lastActiveTabId" && state.lastActiveTab !== null) {
    Logger.info("[bg.js] received 'lastActiveTabId'. Sending tabId " + state.lastActiveTab.id);
    sendResponse(state.lastActiveTab.id);
  }

  // received from options.js to reload Libs
  if(message.action === "reloadLibs") {
    // Why reload libs? If the user changes a tab containing a library definition
    // we must update it before the user executes a rule
    // Otherwise the new function won't be found
    // This is only useful for library functions used in before functions since those are
    // evaluated in the context of the background page
    Logger.info("[bg.js] received reloadLibs from content.js");
    Libs.import();
  }

  // Toggle rematch mode on/off
  if(message.action === "testToggleRematch") {
    state.optionSettings.reevalRules = !state.optionSettings.reevalRules;
    setCyclicRulesRecheck(state.optionSettings.reevalRules);
  }
});

// Saves settings changed by popup or settings page
/*eslint-disable no-unused-vars */
var setSettings = function(settings, value) {
  // First form key => value
  if(typeof value !== "undefined") {
    state.optionSettings[settings] = value;
  } else {
    // Second form: set all
    state.optionSettings = settings;
  }

  // Save settings
  Storage.save(state.optionSettings, Utils.keys.settings);

  // Set cyclic refresh if neccessary
  setCyclicRulesRecheck(state.optionSettings.reevalRules);

  Testing.setVar("settings", JSONF.stringify(state.optionSettings), "Current settings");
  Logger.info("[bg.js] Settings set to " + JSONF.stringify(state.optionSettings));

  // Tell options page to reload the settings
  chrome.runtime.sendMessage({action: "reloadSettings"});
};
/*eslint-enable no-unused-vars */

// Loads settings from storage
var loadSettings = function() {
  // Load the settings and default them if not saved before
  Storage.load(Utils.keys.settings).then(function(settings) {
    Logger.info("[bg.js] loading settings : " + JSONF.stringify(settings));
    if(typeof settings === "undefined") {
      settings = Utils.defaultSettings;
    }
    state.optionSettings = settings;

    // Turn rematch on/off
    setCyclicRulesRecheck(state.optionSettings.reevalRules);
  });
};

// Checks to see if tabSettings are initialized
// If not creates a default tabSetting
var initializeTabSettings = function() {
  // Check if tabs are saved or we start from scratch
  Storage.load(Utils.keys.tabs).then(function (tabSettings) {
    // No tab settings found, create one
    if(typeof tabSettings === "undefined") {
      Logger.info("[bg.js] Creating default tab setting");
      Storage.save([{
        "id": 1,
        "name": chrome.i18n.getMessage("tabs_default_name")
      }], Utils.keys.tabs);

      // Initialize rules
      Rules.save("var rules = [];", 1);
    }
  });
};

// Triggered when update of remote rules was successful
var remoteRulesImportSuccess = function(resolved) {
  Logger.info("[bg.js] Updating remote rules SUCCEEDED");
  RemoteImport.save(resolved.data);
};

// Triggered when update of remote rules was failed
var remoteRulesImportFail = function() {
  Logger.warn("[bg.js] Updating remote rules FAILED");
  Notification.create(chrome.i18n.getMessage("notification_remote_import_failed"), null, function () {
    Utils.openOptions("#settings");
  });
};

// Update remote rules if options are set correctly
var executeRemoteImport = function() {
  if(typeof state.optionSettings !== "undefined" && state.optionSettings.importActive === true && state.optionSettings.importUrl.indexOf("http") > -1) {
    Logger.info("[bg.js] Alarm triggered update of remote rules");
    RemoteImport.import(state.optionSettings.importUrl).then(remoteRulesImportSuccess).catch(remoteRulesImportFail);
  }
};

// This is triggered when the set interval (eg. every 15 minutes) has expired
var alarmListener = function(alarm) {
  if(alarm.name !== Utils.alarmName) {
    return;
  }
  Logger.info("[bg.js] Alarm triggered");
  executeRemoteImport();
};

// REMOVE START
// Debug Messages from content.js
chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function(message) {
    if(message.action === "log" && message.message) {
      Logger.store(message.message);
    }
  });
});
// REMOVE END

// Listen for messages from content.js
chrome.runtime.onMessage.addListener(function (message) {
  // REMOVE START
  if(message.action === "log" && message.message) {
    Logger.store(message.message);
  }
  // REMOVE END

  // The content page (form_filler.js) requests a screenshot to be taken
  // the message.flag can be the filename or true/false
  if(message.action === "takeScreenshot" && typeof message.flag !== "undefined") {
    Logger.info("[bg.js] Request from content.js to take a screenshot of windowId " + state.lastActiveTab.windowId);
    takeScreenshot(state.lastActiveTab.windowId, message.value, message.flag);
  }
});

// Fires when the extension is install or updated
chrome.runtime.onInstalled.addListener(function (details) {

  Logger.info("[bg.js] chrome.runtime.inInstalled triggered");

  // Called on very first install
  if (details.reason === "install") {
    Notification.create(chrome.i18n.getMessage("first_install_notification"), null, function () {
      Utils.openOptions("#help");
    });
  }

  // Initialize tab settings
  initializeTabSettings();

  // remove log entries
  Logger.delete();

  // Check if there are notifications to display
  if(Utils.version.indexOf(".") > -1) {
    Notification.forVersion(Utils.version);
  }

  // load and set settings. Uses defaults if non present.
  loadSettings();

  // This till trigger a re-import of the remote rules set in settings
  Alarm.install();

  // Install ContextMenu
  ContextMenu.install();
});

// When the extension is activated:
chrome.runtime.onStartup.addListener(function() {
  Logger.info("[bg.js] chrome.runtime.onStartup triggered");
  loadSettings();

  // This will trigger a re-import of the remote rules set in settings
  Alarm.install();

  // re-import remote rules
  executeRemoteImport();
});

// Listen to alarms (import remote rules)
chrome.alarms.onAlarm.addListener(alarmListener);

// install listener for remote rules improt requests
RemoteImport.listenToExternal();

// install listener for messages from cotennt page whil filling forms
FormUtil.listenForContentMessages();

