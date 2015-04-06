/*global jQuery, Utils */
/* eslint no-unused-vars: 0 */
//
// Small abstraction over i18n supplied by chrome API
//
var I18n = {
  supportedLanguages: function() {
    return ["en"];
  },
  currentLocale: function() {
    var uiLang = this.userLocale();
    var chosenLang = this.supportedLanguages().filter(function (supportedLanguage) {
      return supportedLanguage === uiLang;
    });
    if(chosenLang.length === 1) {
      this._lang = chosenLang[0];
    } else {
      this._lang = this.supportedLanguages()[0];
    }
    return this._lang;
  },
  userLocale: function() {
    return chrome.i18n.getUILanguage().replace(/_.*$/, "").toLowerCase();
  },
  loadPages: function(pages, prefix) {
    var i18n = this;
    var path = [];
    var appendDomSelector = "";
    pages.forEach(function (pageName) {
      appendDomSelector = "#" + pageName;
      path = [ "html", "options" ];
      if (typeof prefix !== "undefined") {
        path.push(prefix);
        appendDomSelector = "#" + prefix + " " + appendDomSelector;
      }
      path.push("_" + pageName + "_" + i18n.currentLocale() + ".html");
      i18n._getAndInsert(path, appendDomSelector);
    });
  },
  _getAndInsert: function(path, appendDomSelector) {
    jQuery.get(chrome.runtime.getURL(path.join("/")), function (html) {
      jQuery(appendDomSelector).html(html);
      jQuery(document).trigger("i18n-loaded", [ path.join("/") ]);
    });
  }
};

// REMOVE START
if(typeof exports === "object") {
  module.exports = I18n;
}
// REMOVE END
