describe("form filling with shared rules", function() {

  it("fills the form correctly", function(){
    Tests.visit("shared-rules")
    .then(Tests.importRules)
    .then(function () {
      expect($("#i1").getAttribute("value")).to.become("filled by original");
      expect($("#i2").getAttribute("value")).to.become("shared rule 2");
      expect($("#i3").getAttribute("value")).to.become("shared rule 3");
    });
  });

  it("reports an error if a 'import' definition is not found", function(){
    Tests.visit("shared-rules-broken")
    .then(Tests.importRules)
    .then(function () {
      expect($(".notification-html").getText()).to.become("Found an 'import' statement without matching rule. Click here to see more info.");
    });
  });
});
