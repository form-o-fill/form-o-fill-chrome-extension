/*global jQuery Rules Workflows */
var UsageReport = function() {
  this.featuresConfig = {
    "_rule-url-string": "Rule definition: Set if you use the 'url' property with a string as parameter (full url match)",
    "rule-url-string": "",

    "_rule-url-regex": "Rule definition: Set if you use a /regex/ in the 'url' property",
    "rule-url-regex": "",

    "_rule-content-string": "Rule definition: Using 'content' property with a string (page contains text)",
    "rule-content-string": "",

    "_rule-content-regex": "Rule definition: Using 'content' property with a /regex/",
    "rule-content-regex": "",

    "_rule-autorun-boolean": "Rule definition: Using 'autorun' property with true/false",
    "rule-autorun-boolean": "",

    "_rule-autorun-timer": "Rule definition: Using 'autorun' with a millisecond timer value",
    "rule-autorun-timer": "",

    "_rule-screenshot": "Rule definition: 'screenshot' property inside a rule definition",
    "rule-screenshot": "",

    "_rule-only-empty": "Rule definition: 'onlyEmpty' rule property to fill only when a field is empty",
    "rule-only-empty": "",

    "_rule-color": "Rule definition: Color for rule in popup display",
    "rule-color": "",

    "_rule-teardown-content-used": "Rule definition: 'teardownContent' function used",
    "rule-teardown-content-used": "",

    "_rule-setup-content-used": "Rule definition: 'SetupContent' function used",
    "rule-setup-content-used": "",

    "_fields-import-used": "Field definition: 'import' property used to import shared rules",
    "fields-import-used": "",

    "_fields-value-string": "Field definition: 'value'='string' used",
    "fields-value-string": "",

    "_fields-value-function": "Field definition: 'value'=function() used",
    "fields-value-function": "",

    "_fields-only-empty": "Field definition: 'onlyEmpty' used to fill only if the field is empty",
    "fields-only-empty": "",

    "_fields-screenshot": "Field definition: Take a screenshow after field is filled",
    "fields-screenshot": "",

    "_fields-value-function-context-storage-get": "Field definition: content.storage.get used",
    "fields-value-function-context-storage-get": "",

    "_fields-value-function-context-storage-set": "Field definition: content.storage.set used",
    "fields-value-function-context-storage-set": "",

    "_libs-h-screenshot": "Libs: Libs.h.screenshot used",
    "libs-h-screenshot": "",

    "_libs-chance": "Libs: Libs.chance used",
    "libs-chance": "",

    "_libs-moment": "Libs: Libs.moment used",
    "libs-moment": "",

    "_libs-h-click": "Libs: Libs.h.click used to click on things",
    "libs-h-click": "",

    "_libs-h-select": "Libs: Libs.h.select used to force select a checkbox/radiobutton",
    "libs-h-select": "",

    "_libs-h-unselect": "Libs: Libs.h.unselect used to force uncheck a checkbox/radiobutton",
    "libs-h-unselect": "",

    "_libs-h-copy-value": "Libs: Libs.h.copyValue used to copy a value from another selector",
    "libs-h-copy-value": "",

    "_libs-halt": "Libs: Libs.halt used to cancel a rule execution inside before functions",
    "libs-halt": "",

    "_libs-h-display-message": "Libs: Libs.h.displayMessage used to display a message",
    "libs-h-display-message": "",

    "_custom-libraries-used": "Other: You created a customer library function. Nice! They are so cool.",
    "custom-libraries-used": "",

    "_workflows-used": "Other: Using workflows",
    "workflows-used": "",

    "_before-function-used": "Before/After: 'before' function used",
    "before-function-used": "",

    "_after-function-used": "Before/After: 'after' function used. Does anybody really use this?",
    "after-function-used": "",

    "_before-function-context-url": "Before/After: 'before' function: content.url used for something",
    "before-function-context-url": "",

    "_before-function-context-find-html": "Before/After: 'before' function: html finder used on content page",
    "before-function-context-find-html": "",

    "_before-function-context-storage-get": "Before/After: 'before' function: context.storage.get used",
    "before-function-context-storage-get": "",

    "_before-function-context-storage-set": "Before/After: 'before' function: context.storage.set used",
    "before-function-context-storage-set": "",

    "_before-function-context-storage-delete": "Before/After: 'before' function: context.storage.delete. NOBODY uses this :)",
    "before-function-context-storage-delete": "",

    "_before-function-context-get-var": "Before/After: 'before' function: context.getVar used to fetch content JS variables",
    "before-function-context-get-var": "",

    "_options-automatic-rematch": "Options: Currently using automatic rematch",
    "options-automatic-rematch": "",

    "_options-remote-rules": "Options: Using remote rules",
    "options-remote-rules": "",

    "_options-remote-rules-use-password": "Options: Using remote rules + password",
    "options-remote-rules-use-password": "",

    "_options-always-show-popup": "Options: Always show the popup. Ain't it pretty?",
    "options-always-show-popup": "",

    "_options-match-on-load": "Options: Pre 3.0 bevahiour of matching on 'load' event",
    "options-match-on-load": "",

    "_options-dont-match-on-tab-switch": "Options: Deactivate matching of rules on tab switch",
    "options-dont-match-on-tab-switch": "",

    "_rules-rule-count": "Counts: Total number of rules",
    "rules-rule-count": "",

    "_rules-fields-count": "Counts: Total number of field definitions",
    "rules-fields-count": "",

    "_tabs-count": "Counts: Total number of tabs in editor",
    "tabs-count": ""
  };

  this.allFields = [];
  this.workflows = [];
  this.options = {};
};

UsageReport.prototype.features = function() {
  return Object.keys(this.featuresConfig).filter(function(key) {
    return key.indexOf("_") !== 0;
  });
};

UsageReport.prototype.init = function(options) {
  this.options = options;
  this.attachHandler();
};

UsageReport.prototype.setData = function(usageReport) {
  return Promise.all([Rules.all(), Workflows.all()]).then(function(all) {
    usageReport.rules = all[0];
    usageReport.workflows = all[1];
    usageReport.insertPreviewDom(all[0]);
  });
};

UsageReport.prototype.insertPreviewDom = function() {
  jQuery("#modalusagereport .content-area").append(this.previewHTML());
};

UsageReport.prototype.handlePreview = function(usageReport) {
  usageReport.setData(usageReport).then(function() {
    jQuery(".usage-report-preview").addClass("visible");
  });
};

UsageReport.prototype.handleCloseModal = function(usageReport) {
};

UsageReport.prototype.attachHandler = function() {
  var usageReport = this;
  jQuery(document).on("click", ".cmd-preview-usage-report", function() {
    usageReport.handlePreview(usageReport);
  }).on("click", ".cmd-send-usage-cancel", function() {
    usageReport.handleCloseModal(usageReport);
  });
};

UsageReport.prototype.previewHTML = function() {
  var usageReport = this;

  var html = [
    "<table class='usage-report-preview'>",
    "<tr>",
    "  <th>Feature</th>",
    "  <th>Description</th>",
    "  <th>Value</th>",
    "</tr>"
  ];

  var group = "";
  var description;
  var parts;
  var value;

  this.features().forEach(function(feature) {
    description = usageReport.featuresConfig["_" + feature];
    parts = description.match(/^(.*?): ?(.*)$/);
    value = "?";

    if (group !== parts[1]) {
      group = parts[1];
      html.push("<tr class='section'><td colspan=3>" + parts[1] + "</td></tr>");
    }

    var methodName = "_" + feature.replace(/-[a-z]/g, function(match) {
      return match.replace("-", "").toUpperCase();
    });

    if (typeof usageReport[methodName] === "function") {
      value = usageReport[methodName]();
    }

    html.push("<tr><td>" + feature + "</td><td>" + parts[2] + "</td><td>" + value + "</td></tr>");
  });

  html.push("</table>");

  return html.join("");
};

UsageReport.prototype.fields = function() {
  var usageReport = this;

  if (this.allFields.length > 0) {
    return this.allFields;
  }

  this.rules.forEach(function(rule) {
    if (typeof rule.fields !== "undefined") {
      usageReport.allFields = usageReport.allFields.concat(rule.fields);
    }
  });

  return usageReport.allFields;
};

UsageReport.prototype._ruleUrlString = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.url === "string";
  }).length;
};

UsageReport.prototype._ruleUrlRegex = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.url === "object" && "test" in rule.url;
  }).length;
};

UsageReport.prototype._ruleContentString = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.content === "string";
  }).length;
};

UsageReport.prototype._ruleContentRegex = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.content === "object" && "test" in rule.content;
  }).length;
};

UsageReport.prototype._ruleAutorunBoolean = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.autorun === "boolean";
  }).length;
};

UsageReport.prototype._ruleAutorunTimer = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.autorun === "number" || parseInt(rule.autorun, 10) > 0;
  }).length;
};

UsageReport.prototype._ruleScreenshot = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.screenshot !== "undefined";
  }).length;
};

UsageReport.prototype._ruleOnlyEmpty = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.onlyEmpty !== "undefined";
  }).length;
};

UsageReport.prototype._ruleColor = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.color !== "undefined";
  }).length;
};

UsageReport.prototype._ruleTeardownContentUsed = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.teardownContent !== "undefined";
  }).length;
};

UsageReport.prototype._ruleSetupContentUsed = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.setupContent !== "undefined";
  }).length;
};

UsageReport.prototype._fieldsImportUsed = function() {
  return this.fields().filter(function(field) {
    return typeof field.import !== "undefined";
  }).length;
};

UsageReport.prototype._fieldsValueString = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "string";
  }).length;
};

UsageReport.prototype._fieldsValueFunction = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function";
  }).length;
};

UsageReport.prototype._fieldsOnlyEmpty = function() {
  return this.fields().filter(function(field) {
    return typeof field.onlyEmpty !== "undefined";
  }).length;
};

UsageReport.prototype._fieldsScreenshot = function() {
  return this.fields().filter(function(field) {
    return typeof field.screenshot !== "undefined";
  }).length;
};

UsageReport.prototype._fieldsValueFunctionContextStorageGet = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" && field.value.toString().indexOf("context.storage.get") > -1;
  }).length;
};

UsageReport.prototype._fieldsValueFunctionContextStorageSet = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" && field.value.toString().indexOf("context.storage.set") > -1;
  }).length;
};

UsageReport.prototype._libsHScreenshot = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" && field.value.toString().indexOf("Libs.h.screenshot") > -1;
  }).length;
};

UsageReport.prototype._libsChance = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" && field.value.toString().indexOf("Libs.chance") > -1;
  }).length;
};

UsageReport.prototype._libsMoment = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" && field.value.toString().indexOf("Libs.moment") > -1;
  }).length;
};

UsageReport.prototype._libsHClick = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" &&
      (field.value.toString().indexOf("$domNode.click()") > -1 ||
       field.value.toString().indexOf("Libs.h.click") > -1);
  }).length;
};

UsageReport.prototype._libsHSelect = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" &&
      (field.value.toString().indexOf("$domNode.prop(\"checked\", true") > -1 ||
       field.value.toString().indexOf("Libs.h.select") > -1);
  }).length;
};


UsageReport.prototype._libsHUnselect = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" &&
      (field.value.toString().indexOf("$domNode.prop(\"checked\", false") > -1 ||
       field.value.toString().indexOf("Libs.h.unselect") > -1);
  }).length;
};

UsageReport.prototype._libsHCopyValue = function() {
  return this.fields().filter(function(field) {
    return typeof field.value === "function" &&
      (field.value.toString().indexOf("// element not found") > -1 ||
       field.value.toString().indexOf("Libs.h.copyValue") > -1);
  }).length;
};

UsageReport.prototype._libsHalt = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before === "function" && rule.before.toString().indexOf("Libs.halt") > -1;
  }).length;
};

UsageReport.prototype._libsHDisplayMessage = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before === "function" && rule.before.toString().indexOf("Libs.h.displayMessage") > -1;
  }).length;
};

UsageReport.prototype._customLibrariesUsed = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.export === "string" && typeof rule.lib === "function";
  }).length;
};

UsageReport.prototype._workflowsUsed = function() {
  return this.workflows.length;
};

UsageReport.prototype._beforeFunctionUsed = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined";
  }).length;
};

UsageReport.prototype._afterFunctionUsed = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.after !== "undefined";
  }).length;
};

UsageReport.prototype._beforeFunctionContextUrl = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.url") > -1;
  }).length;
};


UsageReport.prototype._beforeFunctionContextFindHtml = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.findHtml") > -1;
  }).length;
};

UsageReport.prototype._beforeFunctionContextStorageGet = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.storage.get") > -1;
  }).length;
};

UsageReport.prototype._beforeFunctionContextStorageSet = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.storage.set") > -1;
  }).length;
};

UsageReport.prototype._beforeFunctionContextStorageDelete = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.storage.delete") > -1;
  }).length;
};

UsageReport.prototype._beforeFunctionContextGetVar = function() {
  return this.rules.filter(function(rule) {
    return typeof rule.before !== "undefined" && rule.before.toString().indexOf("context.getVar") > -1;
  }).length;
};

UsageReport.prototype._optionsAutomaticRematch = function() {
  return this.options.reevalRules === true ? 1 : 0;
};

UsageReport.prototype._optionsRemoteRules = function() {
  return typeof this.options.importUrl === "string" ? 1 : 0;
};

UsageReport.prototype._optionsRemoteRulesUsePassword = function() {
  return typeof this.options.decryptionPassword === "string" ? 1 : 0;
};

UsageReport.prototype._optionsAlwaysShowPopup = function() {
  return this.options.alwaysShowPopup === true ? 1 : 0;
};

UsageReport.prototype._optionsMatchOnLoad = function() {
  return this.options.matchOnLoad === true ? 1 : 0;
};

UsageReport.prototype._optionsDontMatchOnTabSwitch = function() {
  return this.options.dontMatchOnTabSwitch === true ? 1 : 0;
};

UsageReport.prototype._rulesRuleCount = function() {
  return this.rules.length;
};

UsageReport.prototype._rulesFieldsCount = function() {
  return this.fields().length;
};

UsageReport.prototype._tabsCount = function() {
  return jQuery("[data-tab-id]").length;
};
