require("../support/integration_helper");

describe("the popup HTML", function() {
  this.timeout(99999);

  describe("when rules match", function() {
    it("contains selectable <li> elements", function(done){
      Tests.visit("13-simple")
      .getTagName(".popup-html li.select-rule", function (err, tagNames) {
        expect(tagNames.length).to.eql(10);
      })
      .call(done);
    });

    it("contains an link to the options page and the extract overlay", function (done){
      Tests.visit("13-simple")
      .getText(".popup-html a.cmd-show-extract-overlay", function (err, text) {
        expect(text).to.eql("Extract");
      })
      .getText(".popup-html a.to-options", function (err, text) {
        expect(text).to.eql("Options");
      })
      .call(done);
    });
  });

  describe("when no rules match", function() {

    it("contains a link to extract a rules", function (done){
      Tests.visit("06-no-matching-rules")
      .getText(".popup-html h3", function (err, text) {
        expect(text).to.match(/Found no matching rules./);
      })
      .getText(".popup-html a.cmd-show-extract-overlay:first-child", function (err, text) {
        expect(text).to.eql("Create one ?");
      })
      .call(done);
    });

  });
});
