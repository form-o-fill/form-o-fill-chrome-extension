var JSONF = require("../../src/js/global/jsonf.js").clazz;

describe("JSONF", function(){
  it('serializes simple JS objects', function(){
    expect(JSONF.stringify({"a" : "simple", "b": [ "JS", "Object", "Literal" ]})).to.eq("{\n  \"a\": \"simple\",\n  \"b\": [\n    \"JS\",\n    \"Object\",\n    \"Literal\"\n  ]\n}");
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
    var actual = JSONF.stringify(function() { 1; });
    expect(actual).to.eq("\"function () { 1; }\"");
  });
});
