require("../support/integration_helper");

describe("using workflows", function() {

  it("works", function (done) {
    Tests.visit("16-workflow-1")
    .click(".popup-html .select-workflow")
    .pause(global.pause)
    .url().then(function(currentUrl) {
      expect(currentUrl.value).to.eql("http://localhost:9292/form-o-fill-testing/workflow-3.html?");
    })
    .call(done);
  });
});

