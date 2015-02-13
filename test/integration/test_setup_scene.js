require("../support/integration_helper");

describe("test setup", function() {
  it("installs the extension", function(done){
    // The correct (but chrome intern) url for the installed extensions is
    // not chrome://extensions but this:
    browser
    .url("chrome://extensions-frame/")
    .getText(".extension-title", function(err, text) {
      var isInstalled = text.some(function (t) {
        return t === "Form-O-Fill - The programmable form filler";
      });
      expect(isInstalled).to.eql(true);
    })
    .call(done);
  });

  it("starts a simple webserver on port 9292", function(done) {
    browser
    .url("localhost:9292/form-o-fill-testing/simple.html")
    .getTitle(function (err, title) {
      expect(title).to.eql("Form-O-Fill Testpage");
    }).call(done);
  });

  it("imports rules and shows some meta infos", function(done) {
    var page = Tests.visit("simple");

    page.getText(".extension-id", function (err, text) {
      expect(text).to.match(/[a-z0-9]{32}/);
    });

    page.getText(".extension-version", function (err, text) {
      expect(text).to.eql("##VERSION##");
    });

    page.getText(".tab-id", function (err, text) {
      expect(text).to.match(/[0-9]+/);
    });

    page.getText(".extension-version", function (err, text) {
      expect(text).to.eql("##VERSION##");
    });

    page.getText(".testing-mode", function (err, text) {
      expect(text).to.eql("true");
    });

    page.getText(".browser-action-badge-text", function (err, text) {
      expect(text).to.eql("8");
    });

    page.getText(".matching-rules-count", function (err, text) {
      expect(text).to.eql("8");
    });

    page.getHTML(".popup-html", function (err, text) {
      expect(text).to.match(/<h3>Found 8 matches<\/h3>/);
    });

    page.call(done);

  });
});
