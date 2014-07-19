/*global jQuery, Libs */
var rules = [
{
  content: /Something/,
  name: "Testcase for matching by content (1)",
  fields: [
    {
      selector: "input[type=text]",
      value: "found by content"
    }
  ]
},
{
  url: /.*test.*/,
  name: "Testcase matching by URL",
  fields: [
    {
      selector: "input[type=text]",
      value: "found by URL"
    }
  ]
}
];
