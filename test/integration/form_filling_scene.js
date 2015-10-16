/*eslint brace-style:0 */
require("../support/integration_helper");

describe("the form filling", function() {
  this.timeout(9999);

  var importAndExecute = function(ruleToImport, expectedText, done) {
    var ruleName = ruleToImport.replace(/ /g, "-").toLowerCase();

    Tests.visit("13-simple")
    .click("li.select-rule[data-rule-name='" + ruleName + "']")
    .pause(500)
    .getValue("#target", function (err, text) {
      expect(text).to.eql(expectedText);
    })
    .call(done);
  };

  describe("simple rule matching", function() {
    it("works when requesting JSON via jQuery", function (done) {
      importAndExecute("Requesting External JSON", "value by json.json via jQuery.getJSON", done);
    });

    it("works for a rule that is matched by content", function (done) {
      importAndExecute("Matching by content", "found by content", done);
    });

    it("works for a rule that is matched by url", function (done) {
      importAndExecute("Matching by URL", "found by URL", done);
    });

    it("works for a rule that uses a library function", function (done) {
      importAndExecute("Library function", "Hello from a library function!", done);
    });

    it("works for a rule that uses the ENV in a before function", function (done) {
      importAndExecute("Using the ENV in a before function", 'Hello ENV: {"url":{"url":"http://localhost:9292/form-o-fill-testing/simple.html","protocol":"http:","host":"localhost","port":"9292","path":"/form-o-fill-testing/simple.html","query":"","hash":""},"storage":{"base":{}}}', done);
    });

  });

  describe("filling all matched fields", function() {
    it("fills all matched fields with the same value", function (done) {
      Tests.visit("04-filling-all-matched-fields")
      .pause(500)
      .getValue("#i1", function (err, attr) { expect(attr).to.eq("filled"); })
      .getValue("#i2", function (err, attr) { expect(attr).to.eq("filled"); })
      .getValue("#i3", function (err, attr) { expect(attr).to.eq("filled"); })
      .call(done);
    });
  });

  describe("when errors occur while executing the rule", function() {
    it("reports before function errors as notifications", function (done) {
      Tests.visit("13-simple")
      .click("li.select-rule[data-rule-name='error-thrown-in-before-function']")
      .pause(500)
      .getValue("#target", function (err, text) {
        expect(text).to.eql("throw error");
      })
      .getText(".notification-html", function (err, text) {
        expect(text).to.eql("An error occured while executing a before function. Click here to view it.");
      })
      .getText(".notification-status", function (err, text) {
        expect(text).to.eql("visible");
      })
      .call(done);
    });

    it("reports undefined as errors in a notifications", function (done) {
      Tests.visit("13-simple")
      .click("li.select-rule[data-rule-name='undefined-in-before-function']")
      .pause(500)
      .getValue("#target", function (err, text) {
        expect(text).to.eql("undefined in before function");
      })
      .getText(".notification-html", function (err, text) {
        expect(text).to.eql("An error occured while executing a before function. Click here to view it.");
      })
      .getText(".notification-status", function (err, text) {
        expect(text).to.eql("visible");
      })
      .call(done);
    });
  });
});
