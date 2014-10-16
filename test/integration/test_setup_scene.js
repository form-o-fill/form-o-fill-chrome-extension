describe("test setup", function() {
  it("should install the extension from the src/ dir", function(){
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

  it("should start a simple webserver on port 8888", function(){
    browser.get("http://localhost:8888/");
    expect(browser.getTitle()).to.eventually.eq("Form-O-Fill Testpage");
  });
});
