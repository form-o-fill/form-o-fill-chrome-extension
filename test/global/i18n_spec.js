var I18n = require("../../src/js/global/i18n.js");
global.chrome = require("../support/chrome_api.js");

describe("I18n", function(){
  describe(".supportedLanguages", function() {
    it("includes english in the supported languages", function(){
      expect(I18n.supportedLanguages).to.include("en");
    });
  });

  describe(".userLocale", function() {
    it("returns the simplyfied version of the browser language", function(){
      global.chrome.setConfig("uiLanguage", "en_GB");
      expect(I18n.userLocale()).to.eq("en");
    });

    it("downcases the language", function(){
      global.chrome.setConfig("uiLanguage", "EN_GB");
      expect(I18n.userLocale()).to.eq("en");
    });
  });
});

