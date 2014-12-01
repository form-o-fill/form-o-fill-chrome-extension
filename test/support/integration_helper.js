/*global beforeEach browser*/
// This file is run before all other specs
// mocha is already global here
global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.chai.use(require("chai-as-promised"));
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

//
// HELPER function to make life easier:
//

var Tests = {
  // Go to a testing URL and give the extension some time to inject its HTML
  visit: function(htmlPage) {
    return browser
    .url("http://localhost:8889/form-o-fill-testing/" + htmlPage + ".html")
    .click("#form-o-fill-testing-import-submit")
    .pause(1000);
  }
};

global.Tests = Tests;

after(function (done) {
  browser.end(done);
});

