describe("the form filling", function() {

  // Import rules and test a single rule execution
  var importAndExecute = function(ruleText, expectedTextInInput) {
    Tests.visit("simple");
    Tests.importRules().then(function () {
      element(by.cssContainingText("li.select-rule", ruleText)).click().then(function () {
        expect($("#target").getAttribute("value")).to.become(expectedTextInInput);
      });
    });
  };

  describe("simple rule matching", function() {
    it("works for a rule that is matched by content", function(){
      importAndExecute("Matching by content", "found by content");
    });

    it("works for a rule that is matched by url", function(){
      importAndExecute("Matching by URL", "found by URL");
    });

    it("works for a rule that uses a library function", function(){
      importAndExecute("Library function", "Hello from a library function!");
    });

    it("works for a rule that uses the ENV in a before function", function(){
      importAndExecute("Using the ENV in a before function", 'Hello ENV: {"url":{"url":"http://localhost:8889/form-o-fill-testing/simple.html","protocol":"http:","host":"localhost","port":"8889","path":"/form-o-fill-testing/simple.html","query":"","hash":""}}');
    });

    it("works when requesting JSON from via jQuery", function(){
      importAndExecute("Requesting external JSON", "value by json.json via jQuery.getJSON");
    });
  });

  describe("when errors occur while executing the rule", function() {
    it("reports before function errors as notifications", function(){
      Tests.visit("simple");
      Tests.importRules().then(function () {
        element(by.cssContainingText("li.select-rule", "Error thrown in before function")).click().then(function () {
          expect($("#target").getAttribute("value")).to.become("throw error");
          expect($(".notification-html").getText()).to.become("An error occured while executing a before function. Click here to view it.");
          expect($(".notification-status").getText()).to.become("visible");
        });
      });
    });

    it("reports undefined as errors in a notifications", function(){
      Tests.visit("simple");
      Tests.importRules().then(function () {
        element(by.cssContainingText("li.select-rule", "undefined in before function")).click().then(function () {
          expect($("#target").getAttribute("value")).to.become("undefined in before function");
          expect($(".notification-html").getText()).to.become("An error occured while executing a before function. Click here to view it.");
          expect($(".notification-status").getText()).to.become("visible");
        });
      });
    });
  });

  /*
   All recognized <form> field types
   */

});
