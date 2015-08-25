require("../support/integration_helper");

describe("the options panel", function () {
  this.timeout(9999);

  it("is contains all essential parts", function (done){
    Tests.visit("options")
    .click(".extension-options-url a")
    .pause(global.pause)
    .getValue("li.tab.current input", function (err, text) {
      expect(text).to.eql(["dummy", "Workflows"]);
    })
    .isVisible("li.tab.more", function (err, isVisible) {
      // "More" tab
      expect(isVisible).to.eq(true);
    })
    .isVisible("#rules-overview", function (err, isVisible) {
      // Quickjump menu
      expect(isVisible).to.eq(true);
    })
    .isVisible(".menu button.save:first-child", function (err, isVisible) {
      // Action buttons
      expect(isVisible).to.eq(true);
    })
    .isVisible(".menu button.reload", function (err, isVisible) {
      expect(isVisible).to.eq(true);
    })
    .isVisible(".menu button.format", function (err, isVisible) {
      expect(isVisible).to.eq(true);
    })
    .getElementSize("#ruleeditor-ace", function (err, size) {
      // Editor window
      expect(size.height).to.be.above(200);
      expect(size.width).to.be.above(200);
    })
    .getText(".navigation .menu li", function (err, text) {
      // Navigation links
      expect(text).to.contain("Rule Editor");
      expect(text).to.contain("Workflows");
      expect(text).to.contain("Import / Export");
      expect(text).to.contain("Tutorials");
      expect(text).to.contain("About");
      expect(text).to.contain("Changelog");
    })
    .close()
    .call(done);
  });

});
