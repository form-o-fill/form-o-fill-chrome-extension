describe("the options panel", function() {

  it("is available", function(){
    Tests.visit("options")
    .then(function () {
      Tests.importRules();
    })
    .then(function () {
      $(".extension-options-url").click();
    })
    .then(function () {
      // open options in the same window!
      // Doesn't work at the moment because the options open in a new tab
      expect($("li.tab.current input").getAttribute("value")).to.become("dummy");
    });
  });

});
