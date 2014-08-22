/*global Rules, Logger, Utils, FormUtil, Notification, JSONF, Storage, Rule*/
/* eslint complexity:0, max-nested-callbacks: [1,4] */
"use strict";

var lastMatchingRules = [];
var lastActiveTab = null;

// Shows number of matches in the extension's icon
var refreshMatchCounter = function (tab, count) {
  var txt = chrome.i18n.getMessage("no_match_available");
  if (count && count > 0) {
    txt = count.toString();
  }
  chrome.browserAction.setBadgeText({"text": txt, "tabId": tab.id});
  chrome.browserAction.setBadgeBackgroundColor({"color": [0, 136, 255, 200], "tabId": tab.id});
};

// When the user changes a tab, search for matching rules for that url
var onTabReady = function(tabId) {
  // Clear popup HTML
  chrome.browserAction.setPopup({"tabId": tabId, "popup": ""});
  Logger.info("[bg.js] onTabReady on Tab " + tabId);

  chrome.tabs.get(tabId, function (tab) {
    lastMatchingRules = [];
    if (tab.active) {
      lastActiveTab = tab;

      // This is a little bit complicated.
      // First filter all rules that have content matchers
      Rules.all().then(function (rules) {
        var relevantRules = rules.filter(function (rule) {
          return typeof rule.content !== "undefined";
        });
        // Send these rules to the content script so it can return the matching
        // rules based on the regex and the pages content
        chrome.tabs.sendMessage(tabId, { "action": "matchContent", "rules": JSONF.stringify(relevantRules)}, function (matchingContentRules) {
          if(typeof matchingContentRules !== "undefined") {
            // Convert the objects to Rules
            matchingContentRules = JSONF.parse(matchingContentRules).map(function (ruleLike) {
              return Rule.create(ruleLike);
            });
            lastMatchingRules = lastMatchingRules.concat(matchingContentRules);
          } else {
            matchingContentRules = [];
          }
          Logger.info("[bg.js] Got " + matchingContentRules.length + " rules matching the content of the page");
          // Now match those rules that have a "url" matcher
          Rules.match(tab.url).then(function (matchingRules) {
            Logger.info("[bg.js] Got " + matchingRules.length + " rules matching the url of the page");
            lastMatchingRules = lastMatchingRules.concat(matchingRules);
            // Save to localStorage for popup to load
            Rules.lastMatchingRules(lastMatchingRules);
            // Show matches in badge
            refreshMatchCounter(tab, lastMatchingRules.length);
            // No matches? Multipe Matches? Show popup when the user clicks on the icon
            // A single match should just fill the form (see below)
            if (lastMatchingRules.length !== 1) {
              chrome.browserAction.setPopup({"tabId": tab.id, "popup": "html/popup.html"});
            }
          });
        });
      });
    }
  });
};

// Fires when a tab becomes active (https://developer.chrome.com/extensions/tabs#event-onActivated)
chrome.tabs.onActivated.addListener(function (activeInfo) {
  onTabReady(activeInfo.tabId);
});

// Fires when the URL changes (https://developer.chrome.com/extensions/tabs#event-onUpdated)
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status && changeInfo.status === "complete") {
    onTabReady(tabId);
  }
});

// This event will only fire if NO POPUP is set
// This is the case when only one rule matches
chrome.browserAction.onClicked.addListener(function (){
  FormUtil.applyRule(lastMatchingRules[0], lastActiveTab);
});

// Listen for messages from other background/popup scripts
chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {

  Logger.info("[bj.js] Received message " + JSONF.stringify(message));

  // From popup.js:
  // This receives the index of the rule to apply when there is more than one match
  if (message.action === "fillWithRule") {
    Logger.info("[bg.js] called by popup.js with rule index " + message.index + ", sender = " + sender);
    FormUtil.applyRule(lastMatchingRules[message.index], lastActiveTab);
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
    Notification.create("Extracted your form. Click here to check the options panel for more info.", Utils.openOptions);
  }

  // Return the last active tab id
  if(message.action === "lastActiveTabId" && lastActiveTab !== null) {
    Logger.info("[bg.js] received 'lastActiveTabId'. Sending tabId " + lastActiveTab.id);
    sendResponse(lastActiveTab.id);
  }
});

// REMOVE START
// Messages from content.js
chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function(message) {
    if(message.action === "log" && message.message) {
      Logger.store(message.message);
    }
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  if(message.action === "log" && message.message) {
    Logger.store(message.message);
  }
});
// REMOVE END

// Fires when the extension is install or updated
chrome.runtime.onInstalled.addListener(function (details) {
  Logger.info("[bg.js] runtime.onInstalled fired");

  // Called on very first install
  if (details.reason === "install") {
    Notification.create(chrome.i18n.getMessage("first_install_notification"), function () {
      Utils.openOptions("#help");
    });
  }

  // Check if tabs are saved or we start from scratch
  Storage.load(Utils.keys.tabs).then(function (tabSettings) {
    // No tab settings found, create one
    if(typeof tabSettings === "undefined") {
      Logger.info("[bg.js] Creating default tab setting");
      Storage.save([{
        "id": 1,
        "name": chrome.i18n.getMessage("tabs_default_name")
      }], Utils.keys.tabs);
    }
  });

  // remove log entries
  Logger.delete();
});

