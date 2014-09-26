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

  describe(".load_pages", function() {

    beforeEach(function() {
      sinon.stub(jQuery, "ajax").yieldsTo("success", "<div></div>");
    });

    afterEach(function() {
      jQuery.ajax.restore();
    });

    it("loads localized pages and triggers a custom event", sinon.test(function(){
      var triggerSpy = this.spy(jQuery.prototype, "trigger");

      I18n.loadPages(["about"]);

      expect(triggerSpy).to.have.been.calledWith("i18n-loaded", ["html/options/_about_en.html"]);
    }));

    it("inserts the loaded page into the DOM", sinon.test(function(){
      var spy = this.spy(I18n, "_getAndInsert");

      I18n.loadPages(["about"]);

      expect(spy).to.have.been.calledWith(["html", "options", "_about_en.html"], "#about");
    }));

    it("prefixes pages to be loaded", sinon.test(function(){
      var triggerSpy = this.spy(jQuery.prototype, "trigger");

      I18n.loadPages(["about"], "prefix");

      expect(triggerSpy).to.have.been.calledWith("i18n-loaded", ["html/options/prefix/_about_en.html"]);
    }));
  });
});

