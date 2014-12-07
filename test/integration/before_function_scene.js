require("../support/integration_helper");

describe("using before functions", function() {
  this.timeout(9999);

  it("can use HTML found in the content page", function (done) {
    Tests.visit("before-context")
    .getValue("#target", function (err, value) {
      expect(value).to.eq("SOME CONTENT");
    })
    .call(done);
  });
});

