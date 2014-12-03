describe("the options panel", function() {

  var visitOptions = function() {
    return Tests.visit("options")
    .then(Tests.importRules)
    .then($(".extension-options-url a").click)
    .then(function () {
      return browser.driver.sleep(1000);
    });
  };

  it("is contains all essential parts", function(){
    visitOptions().then(function () {
      // Current tab
      expect($("li.tab.current input").getAttribute("value")).to.become("dummy");

      // More tab
      expect($("li.tab.more").isPresent()).to.become(true);

      // Quickump menu
      expect($("#rules-overview").isPresent()).to.become(true);

      // Action buttons
      expect($(".menu button.save").isPresent()).to.become(true);
      expect($(".menu button.reload").isPresent()).to.become(true);
      expect($(".menu button.format").isPresent()).to.become(true);
      expect($(".menu button.export").isPresent()).to.become(true);
      expect($(".menu button.import").isPresent()).to.become(true);

      // Editor window
      $("#ruleeditor-ace").getSize().then(function (size) {
        expect(size.height).to.be.above(200);
        expect(size.width).to.be.above(200);
      });

      // Navigation links
      // This test will fail for the "build" version. Thats OK!
      expect($$(".navigation .menu li").getText()).to.become(["Rule Editor", "Help", "About", "Changelog", "Logs"]);
    });
  });

});
