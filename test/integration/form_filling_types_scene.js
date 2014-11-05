describe("filling different types of fields", function() {
  it("fills all known types", function(){
    Tests.visit("all-types").then(function () {
      Tests.importRules().then(function () {
        // The rule is set to autorun so it will be already executed
        expect($("input[type=text]").getAttribute("value")).to.become("input[type=text]");
        expect($("input[type=radio]").isSelected()).to.become(true);
        expect($("input[type=checkbox]").isSelected()).to.become(true);
        expect($("input[type=button]").getAttribute("value")).to.become("input[type=button]");
        // Change rule to "value: 'animage.png'"
        // Add :_fillImage() and set attr[src] to animage.png
        // Allow checkboxes = true to always fill field (formfiller)
        // Allow checkboxes = false to always deselect field
        expect($("input[type=image]").getAttribute("src")).to.become("animage.png");
        expect($("input[type=password]").getAttribute("value")).to.become("input[type=password]");
      });
    });
  });
});
