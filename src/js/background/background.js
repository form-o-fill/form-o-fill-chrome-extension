/*global Rules, Utils, JSONF*/
(function formoFillEvents() {
  "use strict";

  var lastMatchingRules = [];
  var lastActiveTab = null;

  var refreshMatchCounter = function (tab, count) {
    var txt = chrome.i18n.getMessage("no_match_available");
    if (count && count > 0) {
      txt = count.toString();
    }
    chrome.browserAction.setBadgeText({"text": txt, "tabId": tab.id});
    chrome.browserAction.setBadgeBackgroundColor({"color": [0, 136, 255, 200], "tabId": tab.id});
  };

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
          if (matchingRules.length != 1) {
            chrome.browserAction.setPopup({"tabId": tab.id, "popup": "html/popup.html"});
          }
        });
      }
    });
  };

  var FormFiller = {
    applyRule: function(rule) {
      var message = null;
      var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});
      Utils.log("Applying rule " + JSONF.stringify(rule) + " to tab " + lastActiveTab.id);

      rule.fields.forEach(function (field) {
        message = {
          "action": "fillField",
          "selector": field.selector,
          "value": JSONF.stringify(field.value)
        };
        Utils.log("Posting to content.js: Fill " + field.selector + " with " + field.value);
        port.postMessage(message);
      });
    }
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
    FormFiller.applyRule(lastMatchingRules[0]);
  });

  // Listen for messages
  chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    // Fom popup.js:
    // This receives the index of the rule to apply when there is more than one match
    if (message.action === "fillWithRule") {
      Utils.log("[bg.js] Called by popup.js with rule index " + message.index + ", sender = " + sender);
      FormFiller.applyRule(lastMatchingRules[message.index]);
      sendResponse(true);
    }

    // Open an intern URL (aka. options).
    // Callable by content script that otherwise isn't allowed to open intern urls.
    if(message.action === "openIntern" && message.url) {
      Utils.log("[bg.js] received 'openIntern' with url '" + message.url + "'");
      chrome.tabs.create({ "active": true, "url": message.url });
    }
  });

})();
