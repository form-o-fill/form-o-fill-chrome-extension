/*eslint brace-style:0*/
require("../support/integration_helper");

describe("filling different types of fields", function() {
  this.timeout(99999);

  it("fills all known types", function (done) {
    Tests.visit("01-all-types")
    .getValue("input[type=text]", function (err, value) { expect(value).to.eql("input[type=text]"); })
    .isSelected("input[type=radio]", function (err, value) { expect(value).to.be_true; })
    .isSelected("input[name='checkbox-value']", function (err, value) { expect(value).to.eql(true); })
    .isSelected("input[name='checkbox-true']", function (err, value) { expect(value).to.eql(true); })
    .isSelected("input[name='checkbox-false']", function (err, value) { expect(value).to.eql(false); })
    .getValue("input[type=button]", function (err, value) { expect(value).to.eql("input[type=button]"); })
    .getAttribute("input[type=image]", "src", function (err, src) { expect(src).to.eql("http://localhost:9292/form-o-fill-testing/animage.png"); })
    .getValue("input[type=password]", function (err, value) { expect(value).to.eql("input[type=password]"); })
    .getValue("input[type=search]", function (err, value) { expect(value).to.eql("input[type=search]"); })
    .getValue("input[type=email]", function (err, value) { expect(value).to.eql("someone@example.com"); })
    .getValue("input[type=url]", function (err, value) { expect(value).to.eql("http://form-o-fill.github.io"); })
    .getValue("input[type=tel]", function (err, value) { expect(value).to.eql("491234567890"); })
    .getValue("input[type=range]", function (err, value) { expect(value).to.eql("100"); })
    .getValue("input[type=date]", function (err, value) { expect(value).to.eql("2014-11-04"); })
    .getValue("input[type=month]", function (err, value) { expect(value).to.eql("2014-06"); })
    .getValue("input[type=week]", function (err, value) { expect(value).to.eql("2014-W42"); })
    .getValue("input[type=datetime]", function (err, value) { expect(value).to.eql("1996-12-19T16:39:57-08:00"); })
    .getValue("input[type=datetime-local]", function (err, value) { expect(value).to.eql("1996-12-19T16:39:57.123"); })
    .getValue("input[type=color]", function (err, value) { expect(value).to.eql("#ff0000"); })
    .getValue("select.single", function (err, value) { expect(value).to.eql("option1"); })
    .getValue("select.multiple option:checked", function (err, values) {
      expect(values).to.eql(['multiple1', 'multiple2']);
    })
    .getValue(".textarea", function (err, value) { expect(value).to.eql("textarea"); })
    .call(done);
  });
});
