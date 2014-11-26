/* global editor */
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
      return browser.driver.sleep(2000);
    }).then(function () {
      expect($(".notification-html").getText()).to.become("Extracted your form. Click here to check the options panel for more info.");
    });
  });

  // This is a sad test setup.
  // I can't get expect() to work in the final then().
  // So I kill the complete process leaving the chrome browser open :(
  it("inserts extracted rules into the editor", function() {
    Tests.visit("form-extraction")
    .then(element(by.cssContainingText(".popup-html a.cmd-show-extract-overlay", "Extract")).click)
    .then($(".form-o-fill-overlay-form").click)
    .then(function() {
      return browser.driver.sleep(1000);
    })
    .then($(".extension-options-url a").click)
    .then(function() {
      return browser.driver.sleep(1500);
    })
    .then($("a.cmd-append-extracted").click)
    .then(function() {
      return browser.driver.sleep(2000);
    })
    .then(function() {
      // return content of editor
      return browser.driver.executeScript(function() {
        return editor.getValue();
      });
    })
    .then(function(ruleString) {
      var rule = JSON.parse(ruleString);
      var fail = function(expected, actual) {
        if(JSON.stringify(expected) !== JSON.stringify(actual)) {
          console.error("Expected \n" + JSON.stringify(expected) + "\n to equal actual \n" + JSON.stringify(actual));
          browser.driver.close();
          /*eslint-disable no-process-exit*/
          process.exit(1);
          /*eslint-enable no-process-exit*/
        }
      };
      fail("A rule for http://localhost:8889/form-o-fill-testing/form-extraction.html#", rule.name);
      fail("http://localhost:8889/form-o-fill-testing/form-extraction.html#", rule.url);
      fail({ selector: 'input[name=\'text\']', value: 'text' }, rule.fields[0]);
      fail({ selector: 'input[name=\'checkbox-value\']', value: true }, rule.fields[1]);
      fail({ selector: 'input[name=\'image\']', value: '' }, rule.fields[2]);
      fail({ selector: 'input[name=\'password\']', value: 'password' }, rule.fields[3]);
      fail({ selector: 'input[name=\'radio\']', value: 'radio' }, rule.fields[4]);
      fail({ selector: 'input[name=\'search\']', value: 'search' }, rule.fields[5]);
      fail({ selector: 'input[name=\'email\']', value: 'a@example.com' }, rule.fields[6]);
      fail({ selector: 'input[name=\'url\']', value: 'http://www.example.com' }, rule.fields[7]);
      fail({ selector: 'input[name=\'tel\']', value: '+49123456' }, rule.fields[8]);
      fail({ selector: 'input[name=\'number\']', value: '123' }, rule.fields[9]);
      fail({ selector: 'input[name=\'range\']', value: '100' }, rule.fields[10]);
      fail({ selector: 'input[name=\'date\']', value: '2014-12-31' }, rule.fields[11]);
      fail({ selector: 'input[name=\'month\']', value: '2014-06' }, rule.fields[12]);
      fail({ selector: 'input[name=\'week\']', value: '2014-W42' }, rule.fields[13]);
      fail({ selector: 'input[name=\'time\']', value: '12:01:02.123' }, rule.fields[14]);
      fail({ selector: 'input[name=\'datetime\']', value: '1996-12-19T16:39:57-08:00' }, rule.fields[15]);
      fail({ selector: 'input[name=\'datetime-local\']', value: '1996-12-19T16:39:57.123' }, rule.fields[16]);
      fail({ selector: 'input[name=\'color\']', value: '#ff0000' }, rule.fields[17]);
      fail({ selector: 'textarea[name=\'textarea\']', value: 'textarea' }, rule.fields[18]);
      fail({ selector: 'select[name=\'select\']', value: 'option2' }, rule.fields[19]);
      fail({ selector: 'select[name=\'selectmultiple\']', "value": ["multiple1", "multiple2"]}, rule.fields[20]);
      fail(false, rule.autorun);
    });
  });
});


