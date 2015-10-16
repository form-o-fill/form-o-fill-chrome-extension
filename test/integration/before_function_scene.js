require("../support/integration_helper");

describe("using before functions", function() {
  this.timeout(9999);

  it("can use HTML found in the content page", function (done) {
    Tests.visit("02-before-context")
    .getValue("#target", function (err, value) {
      expect(value).to.eq("<div id=\"form-o-fill-some-content\">SOME CONTENT</div>");
    })
    .call(done);
  });
});

