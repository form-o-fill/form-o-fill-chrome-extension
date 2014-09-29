var Rules = require("../../src/js/global/rules.js");

describe("Rules", function() {
  describe(".match", function() {

    var stubRules = function(out) {
      sinon.stub(Rules, "all").returns(new Promise(function(resolve) {
        resolve(out);
      }));
    };

    afterEach(function () {
      Rules.all.restore();
    });

    it("returns all rules with matching url", function(){
      stubRules([{url: /test\.html/}, {url: /test2\.html/}]);
      return expect(Rules.match("test2.html")).to.become([ { url: /test2\.html/ } ]);
    });

    it("returns an empty array if no rules match", function(){
      stubRules([{url: /test\.html/}, {url: /test2\.html/}]);
      return expect(Rules.match("nomatch.html")).to.eventually.eql([]);
    });

    it("ignores rules which have no url (broken)", function(){
      stubRules([{nourl: /test\.html/}, {url: /test2\.html/}]);
      return expect(Rules.match("test.html")).to.eventually.eql([]);
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

