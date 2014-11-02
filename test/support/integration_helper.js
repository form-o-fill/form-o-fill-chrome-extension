/*global beforeEach browser*/
// This file is run before all other specs
// mocha is already global here
var fs = require('fs');
var Promise = require('promise');

global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.chai.use(require("chai-as-promised"));
global.expect = require("chai").expect;
global.manifest = require('../../src/manifest');
global.Tests = {};

// Test non angular apps by ignoring synchronozation
beforeEach(function() {
  browser.ignoreSynchronization = true;
});

//
// HELPER function to make live easier:
//

// abstract writing screen shot to a file
global.Tests.writeScreenShot = function(data, filename) {
  var stream = fs.createWriteStream(filename);
  stream.write(new Buffer(data, 'base64'));
  stream.end();
};

var Tests = {
  // Logs the current page source to the console
  showPageSource: function() {
    browser.driver.getPageSource().then(function (source) {
      console.log(source);
    });
  },
  // Go to a testing URL and give the extension ome time to inject its HTML
  visit: function(htmlPage) {
    browser.get("http://localhost:8889/form-o-fill-testing/" + htmlPage + ".html");
    browser.driver.sleep(500);
  },
  // import rules
  importRules: function() {
    return new Promise(function (resolve) {
      $("#form-o-fill-testing-import-submit").click().then(function () {
        browser.driver.sleep(500);
        browser.refresh();
        browser.driver.sleep(500);
        resolve();
      });
    });
  }
};

global.Tests = Tests;
