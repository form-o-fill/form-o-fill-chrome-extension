describe("the form extraction", function() {

  it("shows the extraction overlay", function(){
    Tests.visit("form-extraction")
    .then(element(by.cssContainingText(".popup-html a.cmd-show-extract-overlay", "Extract")).click)
    .then(function () {
      expect($("div.form-o-fill-overlay-form").isDisplayed()).to.eventually.be.true;
    });
  });

  it("shows a notification when the user clicks the overlay", function(){
    // I can't explain why this and ONLY this form (mixed then(func) and then(return func))
    // gives a usable result. Bugs me.
    Tests.visit("form-extraction")
    .then(element(by.cssContainingText(".popup-html a.cmd-show-extract-overlay", "Extract")).click)
    .then($(".form-o-fill-overlay-form").click)
    .then(function() {
      return browser.driver.sleep(3000);
    }).then(function () {
      expect($(".notification-html").getText()).to.become("Extracted your form. Click here to check the options panel for more info.");
    });
  });

});

