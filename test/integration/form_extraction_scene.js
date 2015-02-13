/* global editor */
require("../support/integration_helper");

describe("the form extraction", function() {
  this.timeout(99999);

  it("shows the extraction overlay", function(done) {
    Tests.visit("form-extraction")
    .click(".popup-html a.cmd-show-extract-overlay")
    .isVisible("div.form-o-fill-overlay-form", function (err, isVisible) {
      expect(isVisible).to.be_true;
    }).call(done);
  });

  it("shows a notification when the user clicks the overlay", function(done) {
    Tests.visit("form-extraction")
    .click(".popup-html a.cmd-show-extract-overlay")
    .click("div.form-o-fill-overlay-form")
    .pause(global.pause)
    .getText(".notification-html", function (err, text) {
      expect(text).to.eql("Extracted your form. Click here to check the options panel for more info.");
    })
    .call(done);
  });

  it("inserts extracted rules into the editor", function(done) {
    Tests.visit("form-extraction")
    .click(".popup-html a.cmd-show-extract-overlay")
    .pause(global.pause)
    .click("div.form-o-fill-overlay-form")
    .pause(global.pause)
    .click(".extension-options-url a")
    .pause(global.pause)
    .click("a.cmd-append-extracted")
    .execute(function () {
        return editor.getValue();
    }, function (err, ret) {
      var fail = function(expected, actual) {
        expect(JSON.stringify(expected)).to.eql(JSON.stringify(actual));
      };

      var rule = JSON.parse(ret.value);

      fail("A rule for http://localhost:9292/form-o-fill-testing/form-extraction.html#", rule.name);
      fail("http://localhost:9292/form-o-fill-testing/form-extraction.html#", rule.url);
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
    })
    .close()
    .call(done);
  });
});

