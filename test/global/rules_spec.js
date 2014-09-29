var Rules = require("../../src/js/global/rules.js");

describe("Rules", function() {
  describe(".match", function() {

    beforeEach(function() {
      sinon.stub(Rules, "all").returns(new Promise(function(resolve) {
        resolve([{url: /test\.html/}, {url: /test2\.html/}]);
      }));
    });

    it("returns all rules with matching url", function(){
      return expect(Rules.match("test2.html")).to.become([ { url: /test2\.html/ } ]);
    });
  });

  describe(".load", function() {
  });

  describe(".text2function", function() {
  });

  describe(".all", function() {
  });

  describe(".save", function() {
  });

  describe(".delete", function() {
  });

  describe(".format", function() {
  });

  describe(".syntaxCheck", function() {
  });

  describe(".checkBeforeFunction", function() {
  });

  describe(".lastMatchingRules", function() {
  });
});

