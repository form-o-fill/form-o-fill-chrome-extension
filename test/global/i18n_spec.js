var I18n = require("../../src/js/global/i18n.js");

describe("I18n", function(){

  describe(".supportedLanguages", function() {
    it("includes english in the supported languages", function(){
      expect(I18n.supportedLanguages()).to.include("en");
    });
  });

  describe(".current_locale", function() {
    it("returns the default locale if the user locale isn't covered", sinon.test(function(){
      global.chrome.setConfig("uiLanguage", "xy_zz");
      expect(I18n.currentLocale()).to.eql("en");
    }));

    it("returns the default locale if the user locale isn't covered", sinon.test(function(){
      this.stub(I18n, "supportedLanguages").returns(["en", "de"]);
      global.chrome.setConfig("uiLanguage", "de_DE");
      expect(I18n.currentLocale()).to.eql("de");
    }));
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

  xdescribe(".load_pages", function() {
    it("loads localized pages", sinon.test(function(){
      I18n.loadPages(["about"]);
    }));
  });
});

