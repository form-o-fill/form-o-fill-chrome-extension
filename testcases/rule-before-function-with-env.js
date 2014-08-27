var rules = [
{
  url: /.*test.*/,
  name: "Testcase for usinf the ENV in a before function",
  before: function(resolve, env) {
    resolve("Hello ENV: " + JSON.stringify(env));
  },
  fields: [
  {
    selector: "textarea",
    value: function(e, $data) {
      return $data;
    }
  }]
}
];
