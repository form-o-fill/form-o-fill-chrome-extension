/*global Utils, Logger, Rules, jQuery, Workflows */
var Popup = {
  currentUrl: null,
  init: function() {
    var popup = this;

    // Load last matching Rules
    Promise.all([Rules.lastMatchingRules(), Workflows.loadMatches()]).then(function popupInitMatches(lastMatches) {
      popup.updateHtml(lastMatches[0], lastMatches[1]);
    });

    popup.attachEventHandlers();
    Logger.info("[popup.js] popup init done");
  },
  attachEventHandlers: function() {
    // User selects on of many rules in the popup
    jQuery("ul").on("click", "li.select-rule", function () {
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

    // User select a workflow
    jQuery("ul").on("click", "li.select-workflow", function () {
    });

    // Show Extract Overlay when user clicks "create one" link
    jQuery("#popup").on("click", "a.cmd-show-extract-overlay", function () {
      Utils.showExtractOverlay(function() {
        window.close();
      });
    });
  },
  updateHtml: function(matchingRules, matchingWorkflows) {
    this.updateHeadline(matchingRules, matchingWorkflows);
    this.updateMatchingRules(matchingRules);
    this.updateMatchingWorkflows(matchingWorkflows);
    this.updateOptionsLink();
    if(!Utils.isLiveExtension()) {
      this.sendPopupHtmlForTesting();
    }
  },
  sendPopupHtmlForTesting: function() {
    chrome.extension.getBackgroundPage().Testing.setVar("popup-html", jQuery("body").html(), "Popup HTML");
  },
  updateHeadline: function(matchingRules, matchingWorkflows) {
    var ruleMatchesCount = matchingRules.length;
    var createRuleUrl = chrome.extension.getURL("html/options.html#createRule!" + encodeURI(this.currentUrl));
    var message = chrome.i18n.getMessage("found_no_matches", [ createRuleUrl ]);
    if (ruleMatchesCount > 0) {
      message = chrome.i18n.getMessage("found_n_matches", [ ruleMatchesCount + matchingWorkflows.length ]);
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
  updateMatchingWorkflows: function(matches) {
    if(typeof matches === "undefined") {
      return;
    }
    Logger.info("[popup.js] updating popup to display " + matches.length + " workflows");
    var ul = document.querySelectorAll("ul")[0];
    var fragment = document.createDocumentFragment();
    matches.forEach(function(workflow, index) {
      var li = document.createElement("li");
      li.textContent = workflow.name;
      li.classList.add("select-workflow");
      li.classList.add("icon-cascade");
      li.dataset.workflowId = workflow.id;
      li.dataset.workflowIndex = index;
      li.dataset.workflowName = workflow.name.replace(/[^a-zA-Z-]/g, "-").toLowerCase();
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
