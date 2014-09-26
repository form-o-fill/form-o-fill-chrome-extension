var Rule = require("../../src/js/global/rule.js");

describe("Rule", function() {
  describe("#prettyPrint", function() {
    it("returns a clean formatted representtion of a rule", sinon.test(function(){
      var rule = new Rule();
      rule.stays = 1;
      rule.matcher = "goes away";
      rule.nameClean = "goes away";
      rule.urlClean = "goes away";
      rule.id = "goes away";

      expect(rule.prettyPrint()).to.eql("{\n  \"stays\": 1\n}");
    }));
  });

  describe(".create", function() {
    it("creates Rule instances", sinon.test(function(){
      var rule = Rule.create({name: "name"}, 1, 1);
      expect(rule).to.be.instanceof(Rule);
    }));

    it("assigns properties", sinon.test(function(){
      var rule = Rule.create({name: "name", something: true}, 1, 1);
      expect(rule.something).to.be.true;
    }));

    it("sets the 'matcher' attr to a RegExp when 'url' is a RegExp", sinon.test(function(){
      var rule = Rule.create({name: "name", url: /regexp/}, 1, 1);
      expect(rule.matcher).to.eql(/regexp/);
    }));

    it("sets the 'matcher' attr to a full URL matching RegExp if 'url' is string", sinon.test(function(){
      var rule = Rule.create({name: "name", url: "http://a?b=1&c=2"}, 1, 1);
      expect(rule.matcher).to.eql(/^http:\/\/a\?b=1&c=2$/);
    }));

    it("sets the 'urlClean' attr to a string representation of the 'url' attr", sinon.test(function(){
      var rule = Rule.create({name: "name", url: "http://a?b=1&c=2"}, 1, 1);
      expect(rule.urlClean).to.eql("http://a?b=1&c=2");
    }));

    it("sets the 'urlClean' attr to 'n/a' if the 'url' attr is undefined", sinon.test(function(){
      var rule = Rule.create({name: "name"});
      expect(rule.urlClean).to.eql("n/a");
    }));

    it("sets the 'nameClean' attr to a slightly escaped version of 'name'", sinon.test(function(){
      var rule = Rule.create({name: "with <a> tag"});
      expect(rule.nameClean).to.eql("with &lt;a> tag");
    }));

    it("sets the 'id' if not present", sinon.test(function(){
      var rule = Rule.create({name: "with <a> tag"}, 1, 2);
      expect(rule.id).to.eql("1-2");
    }));

    it("doesn't set the 'id' if already present", sinon.test(function(){
      var rule = Rule.create({name: "with <a> tag", id: "5-5"}, 1, 2);
      expect(rule.id).to.eql("5-5");
    }));
  });
});
