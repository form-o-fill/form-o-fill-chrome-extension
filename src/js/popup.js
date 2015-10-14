/*global Utils, Logger, Rules, jQuery, Workflows, Storage */
var Popup = {
  currentUrl: null,
  init: function() {
    var popup = this;

    // Load last matching Rules and workflows
    Promise.all([Rules.lastMatchingRules(), Workflows.loadMatches(), Storage.load(Utils.keys.settings)]).then(function popupInitMatches(lastMatches) {
      popup.updateHtml(lastMatches[0], lastMatches[1]);
      popup.updateToggle(lastMatches[2].reevalRules);
    });

    popup.attachEventHandlers();
    Logger.info("[popup.js] popup init done");
  },
  sendMessageAndClose: function(message) {
    Logger.info("[popup.js] sending message #" + JSON.stringify(message) + " to background.js");
    chrome.extension.sendMessage(message, function() {
      window.close();
    });
  },
  attachEventHandlers: function() {
    var popup = this;

    // User selects on of many rules in the popup
    jQuery("ul").on("click", "li.select-rule", function () {
      var data = jQuery(this).data();
      Logger.info("[popup.js] fill with rule " + data.ruleIndex + " clicked");
      var message = {
        "action": "fillWithRule",
        "index": data.ruleIndex,
        "id": data.ruleId
      };
      popup.sendMessageAndClose(message);
    });

    // User select a workflow
    jQuery("ul").on("click", "li.select-workflow", function () {
      var data = jQuery(this).data();
      Logger.info("[popup.js] fill with workflow #" + data.workflowIndex + " clicked");
      var message = {
        "action": "fillWithWorkflow",
        "index": data.workflowIndex,
        "id": data.workflowId
      };
      popup.sendMessageAndClose(message);
    });

    jQuery("#popup").on("click", "a.cmd-show-extract-overlay", function () {
      // Show Extract Overlay when user clicks "create one" link
      Utils.showExtractOverlay(function() {
        window.close();
      });
    }).on("click", "a.cmd-cancel-workflows", function () {
      // Cancel blocking workflow
      Storage.delete(Utils.keys.runningWorkflow).then(window.close);
    }).on("click", "a.cmd-toggle-re-match", function() {
      // Toggle automatic re-matching of rules on/off
      chrome.extension.sendMessage({"action": "toggleSetting", message: "reevalRules"}, function(currentState) {
        popup.updateToggle(currentState);
      });
    });
  },
  updateToggle: function(currentState) {
    var cl = document.querySelector("a.cmd-toggle-re-match").classList;
    cl.remove("on");
    cl.remove("off");
    cl.add(currentState === true ? "on" : "off");
  },
  updateHeight: function() {
    var html = document.querySelector("html");
    var body = document.querySelector("body");

    html.style.minHeight = html.clientHeight;
    body.style.minHeight = html.clientHeight;
  },
  updateHtml: function(matchingRules, matchingWorkflows) {
    this.updateHeadline(matchingRules, matchingWorkflows);
    this.updateMatchingRules(matchingRules);
    this.updateMatchingWorkflows(matchingWorkflows);
    this.updateOptionsLink();
    if(!Utils.isLiveExtension()) {
      this.sendPopupHtmlForTesting();
    }
    this.updateHeight();
  },
  sendPopupHtmlForTesting: function() {
    chrome.extension.getBackgroundPage().Testing.setVar("popup-html", jQuery("body").html(), "Popup HTML");
  },
  updateHeadline: function(matchingRules, matchingWorkflows) {
    var ruleMatchesCount = matchingRules.length;
    var createRuleUrl = chrome.extension.getURL("html/options.html#createRule!" + encodeURI(this.currentUrl));
    var message = chrome.i18n.getMessage("found_no_matches", [ createRuleUrl ]);
    if (ruleMatchesCount === 1) {
      message = chrome.i18n.getMessage("found_1_match");
    } else if (ruleMatchesCount > 0) {
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
      li.classList.add("icon-bucket");
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
      li.textContent = workflow.name + " (" + workflow.steps.length + " steps)";
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
