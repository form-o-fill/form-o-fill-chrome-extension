/*global Utils, Logger, Rules, Workflows, Storage */
var Popup = {
  currentUrl: null,
  init: function() {
    var popup = this;

    // Update with "No matches"
    popup.updateHtml([], []);

    // Load last matching Rules and workflows
    Promise.all([Rules.lastMatchingRules(), Workflows.loadMatches()]).then(function popupInit(data) {
      popup.updateHtml(data[0], data[1]);
    });

    chrome.runtime.getBackgroundPage(function(bgWindow) {
      popup.updateToggle(bgWindow.state.optionSettings.reevalRules);
    });

    // For chrome < 42: set the link
    if (typeof chrome.runtime.openOptionsPage === "undefined") {
      var toOptionsLink = document.querySelector("a.to-options");
      toOptionsLink.href = chrome.extension.getURL("html/options.html");
      toOptionsLink.target = "blank";
    }

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

    /*eslint-disable complexity*/
    document.addEventListener("click", function(evt) {
      var node = evt.target;
      var message;

      if (!node) {
        return;
      }

      // User selects on of many rules in the popup
      if (node.classList.contains("select-rule")) {
        Logger.info("[popup.js] fill with rule " + node.dataset.ruleIndex + " clicked");
        message = {
          "action": "fillWithRule",
          "index": node.dataset.ruleIndex,
          "id": node.dataset.ruleId
        };
        popup.sendMessageAndClose(message);
      }

      // User select a workflow
      if (node.classList.contains("select-workflow")) {
        Logger.info("[popup.js] fill with workflow #" + node.dataset.workflowIndex + " clicked");
        message = {
          "action": "fillWithWorkflow",
          "index": node.dataset.workflowIndex,
          "id": node.dataset.workflowId
        };
        popup.sendMessageAndClose(message);
      }

      // Show Extract Overlay when user clicks "create one" link
      if (node.classList.contains("cmd-show-extract-overlay")) {
        Utils.showExtractOverlay(function() {
          window.close();
        });
      }

      // Cancel blocking workflow
      if (node.classList.contains("cmd-cancel-workflows")) {
        // Cancel blocking workflow
        Storage.delete(Utils.keys.runningWorkflow).then(window.close);
      }

      // Toggle automatic re-matching of rules on/off
      if (node.classList.contains("cmd-toggle-re-match")) {
        var targetState = !node.classList.contains("on");
        Logger.info("[popup.js] setting toggleSetting -> reevalRules in bg.js (state: " + targetState + ")");
        chrome.runtime.getBackgroundPage(function(bgWindow) {
          bgWindow.setSettings("reevalRules", targetState);
          popup.updateToggle(targetState);
        });
      }

      // Click on options link
      if (node.classList.contains("to-options")) {
        // Chrome 42: use API, otherwise use normal href + target
        if (typeof chrome.runtime.openOptionsPage === "function") {
          chrome.runtime.openOptionsPage();
          evt.stopPropagation();
        }
      }
    });
    /*eslint-enable complexity*/
  },
  updateToggle: function(currentState) {
    Logger.info("[popup.js] setting toggle to " + currentState);
    var cl = document.querySelector("a.cmd-toggle-re-match").classList;
    cl.remove("on");
    cl.remove("off");
    cl.add(currentState ? "on" : "off");
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
    if (!Utils.isLiveExtension()) {
      this.sendPopupHtmlForTesting();
    }
    this.updateHeight();
  },
  sendPopupHtmlForTesting: function() {
    chrome.runtime.getBackgroundPage(function(bgWindow) {
      bgWindow.Testing.setVar("popup-html", document.querySelector("body").innerHTML, "Popup HTML");
    });
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
      li.classList.add(rule.shadow ? "from-shadow" : "from-tabs");
      li.dataset.ruleUrl = rule.url;
      li.dataset.ruleIndex = index;
      li.dataset.ruleId = rule.id;
      li.dataset.ruleName = rule.name.replace(/[^a-zA-Z-]/g, "-").toLowerCase();
      if (typeof rule.color !== "undefined") {
        li.style.color = rule.color;
      }
      fragment.appendChild(li);
    });
    ul.appendChild(fragment);
  },
  updateMatchingWorkflows: function(matches) {
    if (typeof matches === "undefined") {
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
      li.classList.add(workflow.shadow ? "from-shadow" : "from-tabs");
      li.dataset.workflowId = workflow.id;
      li.dataset.workflowIndex = index;
      li.dataset.workflowName = workflow.name.replace(/[^a-zA-Z-]/g, "-").toLowerCase();
      fragment.appendChild(li);
    });
    ul.appendChild(fragment);
  }
};

Popup.init();
