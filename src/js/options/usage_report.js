/*global jQuery */
var UsageReport = function() {
  this.featuresConfig = {
    "_rule-url-string": "Rule definition: Set if you use the 'url' property with a string as parameter (full url match)",
    "rule-url-string": "",

    "_rule-url-regex": "Rule definition: Set if you use a /regex/ in the 'url' property",
    "rule-url-regex": "",

    "_rule-content-string": "Rule definition: Using 'content' property with a string (page contains text)",
    "rule-content-string": "",

    "_rule-content-regex": "Rule definition: Using 'content' proptery with a /regex/",
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

    "_before-functions-used": "Before/After: 'before' function used",
    "before-functions-used": "",

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
};

UsageReport.prototype.features = function() {
  return Object.keys(this.featuresConfig).filter(function(key) {
    return key.indexOf("_") !== 0;
  });
};

UsageReport.prototype.init = function() {
  this.attachHandler();
  this.insertPreviewDom();
};

UsageReport.prototype.insertPreviewDom = function() {
  jQuery("#modalusagereport .content-area").append(this.previewHTML());
};

UsageReport.prototype.handlePreview = function() {
  jQuery(".usage-report-preview").addClass("visible");
};

UsageReport.prototype.attachHandler = function() {
  jQuery(document).on("click", ".cmd-preview-usage-report", this.handlePreview);
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

UsageReport.prototype._ruleUrlString = function() {
  return "YUPP";
};
