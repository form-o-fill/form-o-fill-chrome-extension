/*global Testing */
var Badge = function() {
  this.defaultBadgeBgColor = [0, 136, 255, 200];
  this.intervalBadgeBgColor = [43, 206, 7, 255];
  this.useBadgeBgColor = this.defaultBadgeBgColor;
};

Badge.prototype.setText = function(txt, tabId) {
  chrome.browserAction.setBadgeText({"text": txt, "tabId": tabId});
  chrome.browserAction.setBadgeBackgroundColor({"color": this.useBadgeBgColor, "tabId": tabId});

  Testing.setVar("browser-action-badge-text", txt, "Browser action badge text");
};

Badge.prototype.refreshMatchCounter = function(tab, count) {
  var txt = chrome.i18n.getMessage("no_match_available");
  if (count && count > 0) {
    txt = count.toString();
  }
  this.setText(txt, tab.id);
};

Badge.prototype.setBgColor = function(bgColor, tabId) {
  chrome.browserAction.setBadgeBackgroundColor({"color": bgColor, "tabId": tabId});
};
