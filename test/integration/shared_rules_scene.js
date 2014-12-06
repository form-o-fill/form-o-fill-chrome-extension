require("../support/integration_helper");

describe("form filling with shared rules", function () {
  this.timeout(9999);

  it("fills the form correctly", function (done) {
    Tests.visit("shared-rules")
    .getValue("#i1", function (err, value) {
       expect(value).to.eq("filled by original");
    })
    .getValue("#i2", function (err, value) {
       expect(value).to.eq("shared rule 2");
    })
    .getValue("#i3", function (err, value) {
       expect(value).to.eq("shared rule 3");
    })
    .call(done);
  });

  it("reports an error if a 'import' definition is not found", function (done) {
    Tests.visit("shared-rules-broken")
    .getText(".notification-html", function (err, text) {
      expect(text).to.eq("Found an 'import' statement without matching rule. Click here to see more info.");
    })
    .call(done);
  });
});
