/*global Utils, Logger, Rules, jQuery*/
var Popup = {
  currentUrl: null,
  init: function() {
    var popup = this;

    // Load last matching Rules
    Rules.lastMatchingRules().then(function (matchingRules) {
      popup.updateHtml(matchingRules);
    });

    popup.attachEventHandlers();
    Logger.info("[popup.js] popup init done");
  },
  attachEventHandlers: function() {
    // User selects on of many rules in the popup
    jQuery("ul").on("click", "li", function () {
      var data = jQuery(this).data();
      Logger.info("[popup.js] fill with rule " + data.ruleIndex + " clicked");
      var message = {
        "action": "fillWithRule",
        "index": data.ruleIndex,
        "id": data.ruleId
      };
      Logger.info("[popup.js] sending message " + JSON.stringify(message) + " to background.js");
      chrome.extension.sendMessage(message, function(ok) {
        if(ok) {
          // Close the popup
          window.close();
        }
      });
    });

    // Show Extract Overlay when user clicks "create one" link
    jQuery("#popup").on("click", "a.cmd-show-extract-overlay", function () {
      Utils.showExtractOverlay(function() {
        window.close();
      });
    });
  },
  updateHtml: function(matchingRules) {
    this.updateHeadline(matchingRules);
    this.updateMatchingRules(matchingRules);
    this.updateOptionsLink();
    if(!Utils.isLiveExtension()) {
      this.sendPopupHtmlForTesting();
    }
  },
  sendPopupHtmlForTesting: function() {
    chrome.extension.getBackgroundPage().Testing.setVar("popup-html", jQuery("body").html(), "Popup HTML");
  },
  updateHeadline: function(matchingRules) {
    var matchesCount = matchingRules.length;
    var createRuleUrl = chrome.extension.getURL("html/options.html#createRule!" + encodeURI(this.currentUrl));
    var message = chrome.i18n.getMessage("found_no_matches", [ createRuleUrl ]);
    if (matchesCount > 0) {
      message = chrome.i18n.getMessage("found_n_matches", [ matchesCount ]);
    }
    document.querySelectorAll("h3")[0].innerHTML = message;
  },
  updateMatchingRules: function(matchingRules) {
    Logger.info("[popup.js] updating popup to display " + matchingRules.length + " rules");
    var ul = document.querySelectorAll("ul")[0];
    var fragment = document.createDocumentFragment();
    Utils.sortRules(matchingRules).forEach(function(rule, index) {
      var li = document.createElement("li");
      li.textContent = rule.name;
      li.classList.add("select-rule");
      li.classList.add("icon-archive");
      li.dataset.ruleUrl = rule.url;
      li.dataset.ruleIndex = index;
      li.dataset.ruleId = rule.id;
      li.dataset.ruleName = rule.name.replace(/[^a-zA-Z-]/g, "-").toLowerCase();
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
