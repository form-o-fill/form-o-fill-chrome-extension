/*eslint brace-style:0*/
require("../support/integration_helper");

describe("using all features at once", function() {
  this.timeout(99999);

  it("works", function (done) {
    Tests.visit("22-complex")
    .getText("td.settings", function(err, value) {
      // Check setting of reevalRules
      expect(JSON.parse(value).reevalRules).to.eql(false);
    })
    .pause(500)
    .click(".cmd-toggle-re-match")
    .pause(500)
    .getText("td.settings", function(err, value) {
      // Check setting of reevalRules
      // Should now be "true"
      expect(JSON.parse(value).reevalRules).to.eql(true);
    })
    .click(".clickme")
    .pause(2500)
    .click(".select-workflow")
    .pause(2500)
    .getValue("#target0", function (err, value) { expect(value).to.eql("set by setupContent"); })
    .getValue("#target1", function (err, value) { expect(value).to.eql("value by json.json via jQuery.getJSON"); })
    .getValue("#target2", function (err, value) { expect(value).to.match(/[a-zA-z]+ [a-zA-Z]+/); })
    .getValue("#target3", function (err, value) { expect(value).to.contain("2015-"); })
    .getValue("#target4", function (err, value) { expect(value).to.contain("clicked"); })
    .getValue("#target5", function (err, value) { expect(value).to.contain("returned by customerFunction"); })
    .getValue("#target6", function (err, value) { expect(value).to.contain("localhost"); })
    .getValue("#target7", function (err, value) { expect(value).to.contain("<title>Form-O-Fill Testpage</title>"); })
    .getValue("#target8", function (err, value) { expect(value).to.contain("set by shared rule"); })
    .getValue("#target10", function (err, value) { expect(value).to.contain("<title>Form-O-Fill Testpage</title>"); })
    .getValue("#target12", function (err, value) { expect(value).to.contain("teardownContent"); })
    .getValue("#target13", function (err, value) { expect(value).to.contain("was empty"); })
    .url().then(function(currentUrl) {
      expect(currentUrl.value).to.eql("http://localhost:9292/form-o-fill-testing/22-complex-2.html?");
    })
    .call(done);
  });
});
