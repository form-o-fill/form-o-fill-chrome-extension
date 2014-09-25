var JSONF = require("../../src/js/global/jsonf.js");

describe("JSONF", function(){
  it('serializes simple JS objects', function(){
    expect(JSONF.stringify({"a" : "simple", "b": [ "JS", "Object", "Literal" ]})).to.eq("{\n  \"a\": \"simple\",\n  \"b\": [\n    \"JS\",\n    \"Object\",\n    \"Literal\"\n  ]\n}");
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

  it("works with {} curly brackets (#16)", function(){
    /*eslint-disable no-undef, no-unused-vars, block-scoped-var*/
    var func = function (a) {
      return {a:42};
    };
    /*eslint-enable no-undef, no-unused-vars, block-scoped-var*/
    var serialized = JSONF.stringify(func);
    expect(JSONF.parse(serialized)()).to.eql({a:42});
  });

});
