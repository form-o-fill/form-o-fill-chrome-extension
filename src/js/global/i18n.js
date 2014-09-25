/*global jQuery */
/* eslint no-unused-vars: 0 */
//
// Small abstraction over i18n supplied by chrome API
//
var I18n = {
  supportedLanguages: [
    "en"
  ],
  currentLocale: function() {
    if(this._lang) {
      return this._lang;
    }
    var uiLang = this.userLocale();
    var chosenLang = this.supportedLanguages.filter(function (supportedLanguage) {
      return supportedLanguage === uiLang;
    });
    if(chosenLang.length === 1) {
      this._lang = chosenLang[0];
    } else {
      this._lang = this.supportedLanguages[0];
    }
    return this._lang;
  },
  userLocale: function() {
    return chrome.i18n.getUILanguage().replace(/-.*$/,"").toLowerCase();
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
      jQuery(appendDomSelector).html(html).trigger("i18n-loaded", [ path.join("/") ]);
    });
  }
};

// REMOVE START
// When running inside node we assume we are being unit-tested.
// Use like this in your tests:
// var JSONF = require("../../src/js/global/jsonf.js").clazz;
if(typeof exports === "object") {
  exports.clazz = I18n;
}
// REMOVE END
