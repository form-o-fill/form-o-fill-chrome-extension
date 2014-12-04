/*global beforeEach browser*/
// This file is run before all other specs
// mocha is already global here
global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.expect = require("chai").expect;
global.manifest = require('../../src/manifest');

var webdriverio = require('webdriverio');

var options = {
  desiredCapabilities: {
    browserName: 'chrome',
    chromeOptions: {
      'args': [
        'load-extension=src',
        'enable-embedded-extension-options'
      ]
    }
  }
};

global.browser = webdriverio.remote(options).init();
global.pause = 1000;

//
// HELPER function to make life easier:
//

var Tests = {
  // Go to a testing URL and give the extension some time to inject its HTML
  visit: function(htmlPage) {
    var page = browser
    .url("http://localhost:8889/form-o-fill-testing/" + htmlPage + ".html");
    // Import rules if present
    page.isExisting("#form-o-fill-testing-import-submit", function (err, isExisting) {
      if (isExisting) {
        page = page.click("#form-o-fill-testing-import-submit");
      }
    });
    return page.pause(global.pause);
  }
};

global.Tests = Tests;

//
// Global hooks for mocha
//
after(function (done) {
  browser.end(done);
});
