/*eslint-disable no-unused-vars, brace-style*/
var JSONF = require("../../src/js/global/jsonf.js");

describe("JSONF", function(){
  it('serializes simple JS objects', function(){
    expect(JSONF.stringify({"a": "simple", "b": [ "JS", "Object", "Literal" ]})).to.eq("{\n  \"a\": \"simple\",\n  \"b\": [\n    \"JS\",\n    \"Object\",\n    \"Literal\"\n  ]\n}");
  });

  it("serializes and deserializes 'undefined'", function(){
    var serialized = JSONF.stringify({a: undefined});
    expect(serialized).to.eql("{\n  \"a\": \"**JSONF-UNDEFINED**\"\n}");
    var parsed = JSONF.parse(serialized);
    expect(parsed.a).to.be_undefined;
  });

  it("deserializes simple JS objects", function(){
    var actual = JSONF.parse("{\n  \"a\": \"simple\",\n  \"b\": [\n    \"JS\",\n    \"Object\",\n    \"Literal\"\n  ]\n}");
    expect(actual.a).to.eql("simple");
    expect(actual.b).to.eql(["JS", "Object", "Literal"]);
  });

  it("restores serialized regexs", function(){
    var actual = JSONF.parse(JSONF.stringify("/[0-9]/"));
    expect(actual).to.have.property("test");
  });

  it("serializes functions", function(){
    var func = function() {
      return 42;
    };
    var serialized = JSONF.stringify(func);
    expect(serialized).to.eq("\"function () {\\n      return 42;\\n    }\"");

    expect(JSONF.parse(serialized)()).to.eq(42);
  });

  describe("ES2015 functions", () => {

    it("serializes ES2015 arrow functions", () => {
      var func = (p1, p2) => { return "return"; };
      var serialized = JSONF.stringify(func);
      expect(serialized).to.eq("\"(p1, p2) => { return \\\"return\\\"; }\"");
    });

    //(p1, p2, p3) => {\n      return 42;\n    }
    //() => {\n      return 42;\n    }
    //([a, b] = [1, 2], {x: c} = {x: a + b}) => a + b + c;
    //([a, b] = [1, 2], {x: c} = {x: a + b}) => a + b + c
    //() => 1;
    //() => 1
    //singleParam => { return singleParam }
    it("works with version 1", () => {
      var func = (resolve, context) => {
        return 42;
      };
      var serialized = JSONF.stringify(func);
      expect(serialized).to.eq("\"(resolve, context) => {\\n        return 42;\\n      }\"");
      expect(JSONF.parse(serialized)()).to.eq(42);
    });

    it("works with version 2", () => {
      var func = (resolve, context) => { return 42; };
      var serialized = JSONF.stringify(func);
      expect(JSONF.parse(serialized)()).to.eq(42);
    });

    it("works with version 3", () => {
      var func = () => { return 42; };
      var serialized = JSONF.stringify(func);
      expect(JSONF.parse(serialized)()).to.eq(42);
    });

    it("works with version 4", () => {
      var func = (a) => a;
      var serialized = JSONF.stringify(func);
      expect(JSONF.parse(serialized)(42)).to.eq(42);
    });

    it("works with version 5", () => {
      var func = singleParam => { return singleParam; };
      var serialized = JSONF.stringify(func);
      expect(JSONF.parse(serialized)(43)).to.eq(43);
    });

    it("serializing works with a field definition example", () => {
      let serialized = "{\"value\": \"(p1, p2) => { return \\\"return\\\"; }\"}";
      let deserialized = JSONF.parse(serialized);
      expect(deserialized.value(1,2)).to.eq("return");
    });

    it("works with template literals", () => {
      var func = (a) => `VALUE ${a}`;
      let serialized = JSONF.stringify(func);
      let deserialized = JSONF.parse(serialized);
      expect(deserialized("1")).to.eq("VALUE 1");
    });
  });

  it("works with different formatted functions (#27)", function(){
    /*eslint-disable brace-style*/
    var func = function()
    {
      return 42;
    };
    /*eslint-enable brace-style*/
    var serialized = JSONF.stringify(func);
    expect(serialized).to.eq("\"function ()\\n    {\\n      return 42;\\n    }\"");
    expect(JSONF.parse(serialized)()).to.eq(42);
  });

  it("works with functions that have names", function(){
    var func = function anonymous() {
      return 42;
    };
    var serialized = JSONF.stringify(func);
    expect(serialized).to.eq("\"function anonymous() {\\n      return 42;\\n    }\"");
    expect(JSONF.parse(serialized)()).to.eq(42);
  });

  it("works with {} curly brackets (#16)", function(){
    /*eslint-disable no-undef, no-unused-vars, block-scoped-var*/
    var func = function (a) {
      return {a: 42};
    };
    /*eslint-enable no-undef, no-unused-vars, block-scoped-var*/
    var serialized = JSONF.stringify(func);
    expect(JSONF.parse(serialized)()).to.eql({a: 42});
  });

  it("works with dynamic created functions", function(){
    /*eslint-disable no-undef, no-unused-vars, block-scoped-var, no-new-func*/
    var func = new Function("return true;");
    /*eslint-enable no-undef, no-unused-vars, block-scoped-var, no-new-func*/
    var serialized = JSONF.stringify(func);
    expect(JSONF.parse(serialized)()).to.eql(true);
  });

});
