/*global jQuery, Libs */
var rules = [
  {
  "url": "http://localhost:9090/test.html",
  "name": "A rule for http://localhost:9090/test.html",
  "before": function(resolve) {
    jQuery.getScript("https://rawgit.com/adamwdraper/Numeral-js/master/min/numeral.min.js")
    .done(function() {
      Libs.add("numeral", window.numeral);
      resolve();
      console.log("ADDED NUMERAL");
    });
  },
  "fields": [
    {
    "selector": "input[name='text']",
    "value": function() {
      return Libs.numeral(1000).format('0,0');
    }
  }]
}];

chrome.permissions.request({
  origins: ['https://rawgit.com/']
}, function(granted) {
  if (granted) {
    console.log("GRANTED");
  } else {
    console.log("NOT GRANTED");
  }
});
