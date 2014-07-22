var rules = [
{
  url: /.*test.*/,
  name: "Testcase for all <form> field types",
  before: function(resolve) {
    var data;
    for(var i=0; i < 1000000; i++) {
      data = Math.random();
    }
    resolve(data);
  },
  fields: [
  {
    selector: "input[type=text]",
    value: function(e, $data) {
      return $data;
    }
  }]
}
];
