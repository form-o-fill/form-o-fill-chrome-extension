/*global Storage */
var Rules = require("../../src/js/global/rules.js");

describe("Rules", function() {
  var stubRules = function(out) {
    sinon.stub(Rules, "all").returns(new Promise(function(resolve) {
      resolve(out);
    }));
  };

  var stubStorage = function(rulesData) {
    sinon.stub(Storage, "load").returns(new Promise(function(resolve) {
      resolve(rulesData);
    }));
  };

  describe(".match", function() {

    afterEach(function () {
      Rules.all.restore();
    });

    it("returns all rules matching the full url when a string is passed", () => {
      stubRules([{url: "http://localhost:9292/test.html"}, {url: /test2\.html/}]);
      return expect(Rules.match("http://localhost:9292/test.html")).to.become([ { url: "http://localhost:9292/test.html" } ]);
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

    afterEach(function () {
      Storage.load.restore();
    });

    it("returns an empty array when rulesData is null", sinon.test(function(){
      stubStorage(null);
      return expect(Rules.load(1)).to.eventually.eql(null);
    }));

    it("returns an array of Rule instances", sinon.test(function(){
      stubStorage({
        "code": "var rules = [{ 'url': 'url', 'name': 'name' }];",
        "tabId": "1"
      });

      // These are the expected properties of a Rule instance:
      var ruleProperties = ['url', 'name', 'url', 'urlClean', 'nameClean', 'id'];

      // Make an array of expectation and return them all resolved
      return Promise.all(ruleProperties.map(function (ruleProperty) {
        return expect(Rules.load(1)).to.eventually.have.deep.property("[0]." + ruleProperty);
      }));
    }));
  });

  describe(".text2function", function() {
    it("returns the executed rulecode", sinon.test(function(){
      expect(Rules.text2function("var rules=[{'a':1}];")).to.eql([{'a':1}]);
    }));

    it("returns false if there are no executable rules", sinon.test(function(){
      expect(Rules.text2function("var rules = null;")).to.eql(false);
    }));
  });

  describe(".all", function() {
    it("returns an flattened array of all rules of all tabs", sinon.test(function(){
      stubStorage([{"id": "1", "name": "Rules"},{"id": "2", "name": "Rules2"} ]);
      sinon.stub(Rules, "load").returns(new Promise(function(resolve) {
        resolve([{url: /test\.html/}, {url: /test2\.html/}]);
      }));

      return expect(Rules.all()).to.eventually.have.length(4);
    }));
  });

  describe(".save", function() {
    it("saves the rules", sinon.test(function(){
      var stub = sinon.stub(Storage, "save").returns(new Promise(function(resolve) {
        resolve(true);
      }));
      Rules.save("var rules=[];", 1);
      expect(stub).to.have.been.calledWith({ code: "var rules=[];", tabId: 1 });
    }));
  });

  describe(".delete", function() {
    it("deletes rules of a tabId", sinon.test(function(){
      var spy = sinon.stub(Storage, "delete");
      Rules.delete(1);
      expect(spy).to.have.been.calledWith("form-o-fill-rules-tab-1");
    }));
  });

  describe("._nameForTabId", function() {
    it("returns the storage name for a tab", sinon.test(function(){
      expect(Rules._nameForTabId(1)).to.eql("form-o-fill-rules-tab-1");
    }));
  });

  describe(".format", function() {
    var actual = Rules.format("var rules=[{}];");
    expect(actual).to.eql("var rules=[{}\n];");
  });

  describe(".syntaxCheck", function() {
  });

  describe(".checkBeforeFunction", function() {
  });

  describe(".lastMatchingRules", function() {
  });
});

