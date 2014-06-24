/*global Rules, Utils, FormUtil, Notification, JSONF*/
/* eslint complexity:0 */
(function formoFillEvents() {
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

  // When the user changes a tab, search for matching ules fo that url
  var onTabReady = function(tabId) {
    chrome.browserAction.setPopup({"tabId": tabId, "popup": ""});
    Utils.log("onTabReady on Tab " + tabId);
    chrome.tabs.get(tabId, function (tab) {
      lastMatchingRules = null;
      if (tab.active) {
        lastActiveTab = tab;
        Rules.matchesForUrl(tab.url).then(function (matchingRules) {
          lastMatchingRules = matchingRules;
          refreshMatchCounter(tab, matchingRules.length);
          // No matches? Multipe Matches? Show popup when the user clicks in the icon
          // A single match should just fill the form (see below)
          if (matchingRules.length != 1) {
            chrome.browserAction.setPopup({"tabId": tab.id, "popup": "html/popup.html"});
          }
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

  // Listen for messages
  chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {

    Utils.log("[bj.js] Received message " + JSONF.stringify(message));

    // From popup.js:
    // This receives the index of the rule to apply when there is more than one match
    if (message.action === "fillWithRule") {
      Utils.log("[bg.js] Called by popup.js with rule index " + message.index + ", sender = " + sender);
      FormUtil.applyRule(lastMatchingRules[message.index], lastActiveTab);
      sendResponse(true);
    }

    // Open an intern URL (aka. options).
    // Callable by content script that otherwise isn't allowed to open intern urls.
    if(message.action === "openIntern" && message.url) {
      Utils.log("[bg.js] received 'openIntern' with url '" + message.url + "'");
      chrome.tabs.create({ "active": true, "url": message.url });
    }

    // Display a notification to the user that the extract has finished
    if(message.action === "extractFinishedNotification") {
      Utils.log("[bg.js] received 'extractFinishedNotification'");
      Notification.create("Extracted your form. Click here to check the options panel for more info.", Utils.openOptions);
    }
  });

})();
