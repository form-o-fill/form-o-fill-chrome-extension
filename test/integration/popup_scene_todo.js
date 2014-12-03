describe("the popup HTML", function() {

  describe("when rules match", function() {
    it("contains selectable <li> elements", function(){
      Tests.visit("simple").then(function () {
        Tests.importRules().then(function () {
          element.all(by.css('.popup-html li.select-rule')).then(function (elems) {
            expect(elems.length).to.eql(8);
          });
        });
      });
    });

    it("contains an link to the options page and the extract overlay", function(){
      Tests.visit("simple").then(function () {
        Tests.importRules().then(function () {
          expect($(".popup-html a.cmd-show-extract-overlay").getText()).to.become("Extract");
          expect($(".popup-html a.to-options").getText()).to.become("Options");
        });
      });
    });
  });

  describe("when no rules match", function() {

    it("contains a link to extract a rules", function(){
      Tests.visit("no-matching-rules").then(function () {
        Tests.importRules().then(function () {
          expect($(".popup-html h3").getText()).to.eventually.match(/Found no matching rules./);
          expect($(".popup-html a.cmd-show-extract-overlay:first-child").getText()).to.become("Create one ?");
        });
      });
    });

  });
});
