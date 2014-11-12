describe("form filling with shared rules", function() {

  it("fills the form correctly", function(){
    Tests.visit("shared-rules").then(Tests.importRules).then(function () {
      expect($("#i1").getAttribute("value")).to.become("filled by original");
      expect($("#i2").getAttribute("value")).to.become("shared rule 2");
      expect($("#i3").getAttribute("value")).to.become("shared rule 3");
    });
  });
});
