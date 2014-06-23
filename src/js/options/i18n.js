/*global jQuery */
//
// Small abstraction over i18n supplied by chome API
//
var I18n = {
  supportedLanguages: [
    "en"
  ],
  currentLocale: function() {
    if(this._lang) {
      return this._lang;
    }
    var uiLang = chrome.i18n.getUILanguage().replace(/-.*$/,"").toLowerCase();
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
  loadPages: function(pages) {
    var i18n = this;
    pages.forEach(function (pageName) {
      jQuery.get(chrome.runtime.getURL("html/options/_" + pageName + "_" + i18n.currentLocale() + ".html"), function (html) {
        jQuery("#" + pageName).html(html).show();
      });
    });
  }
};
