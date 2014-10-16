beforeEach(function() {
  browser.ignoreSynchronization = true;
});

describe("form-o-fill installation", function() {
  it("should be installed", function(){
    // The correct (bit chrome intern) url for the installed extensions is
    // not chrome://extensions but this:
    browser.get("chrome://extensions-frame/");

    // Find all extension titles and filter them for the manifest.name title.
    element.all(by.css(".extension-title")).filter(function(extTitleElement) {
      return extTitleElement.getText().then(function(text) {
        return text === manifest.name;
      });
    }).then(function(foundEls) {
      expect(foundEls.length).to.eq(1);
    });
  });
});
