/*global Utils, Rules*/
"use strict";
var Popup = {
  currentUrl: null,
  init: function() {
    var popup = this;
    // last active tab in focused window is the query url
    chrome.tabs.query({"active": true, "lastFocusedWindow": true}, function(tabs) {
      popup.currentUrl = tabs[0].url;
      Rules.matchesForUrl(popup.currentUrl).then(function (matchingRules) {
        popup.updateHtml(matchingRules);
      });
    });
    Utils.log("popup init done");
  },
  updateHtml: function(matchingRules) {
    this.updateHeadline(matchingRules);
    this.updateMatchingRules(matchingRules);
    this.updateOptionsLink();
  },
  updateHeadline: function(matchingRules) {
    var matchesCount = matchingRules.length;
    var createRuleUrl = chrome.extension.getURL("html/options.html?action=createRule&forUrl=" + encodeURI(this.currentUrl));
    var message = chrome.i18n.getMessage("found_no_matches", [ createRuleUrl ]);
    if (matchesCount > 0) {
      message = chrome.i18n.getMessage("found_n_matches", [ matchesCount ]);
    }
    document.querySelectorAll("h3")[0].innerHTML = message;
  },
  updateMatchingRules: function(matchingRules) {
    var ul = document.querySelectorAll("ul")[0];
    var fragment = document.createDocumentFragment();
    matchingRules.forEach(function(rule, index) {
      var li = document.createElement("li");
      li.textContent = rule.name;
      li.classList.add("select-rule");
      li.classList.add("icon-archive");
      li.dataset.ruleUrl = rule.url;
      li.dataset.ruleIndex = index;
      fragment.appendChild(li);
    });
    ul.appendChild(fragment);
  },
  updateOptionsLink: function() {
    var toOptionsLink = document.querySelectorAll("a.to-options")[0];
    toOptionsLink.href = chrome.extension.getURL("html/options.html");
    toOptionsLink.textContent = chrome.i18n.getMessage("options");
    toOptionsLink.classList.remove("hidden");
  }
};

Popup.init();
