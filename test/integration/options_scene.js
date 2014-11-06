describe("the options panel", function() {

  it("is available", function(){
    //Tests.visit("options")
    browser.driver.get("http://localhost:8889/form-o-fill-testing/options.html")
    .then(function () {
      console.log("IR");
      Tests.importRules();
    })
    .then(function () {
      return $(".extension-options-url a").getAttribute("href");
    })
    .then(function (optionsUrl) {
      return browser.driver.executeScript("window.location.href='" + optionsUrl + "';");
    })
    .then(function () {
      return browser.driver.getCurrentUrl();
    })
    .then(function (url) {
      // open options in the same window!
      // Doesn't work at the moment because the options open in a new tab
      console.log(url);
      //expect($("li.tab.current input").getAttribute("value")).to.become("dummy");
    });
  });

});
