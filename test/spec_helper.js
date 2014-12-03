// Expectation Framework
global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.expect = require("chai").expect;

// Sinon for stubbing/mocking
global.sinon = require("sinon");

// Simulate the DOM inside node
global.jsdom = require("jsdom");

// A stubbed chrome API
global.chrome = require("./support/chrome_api.js");

// jQuery loaded with the jsDOM window
global.jQuery = require("./support/jquery.js")(jsdom.jsdom().parentWindow);

// Stub out the normal logger from ogger.js
global.Logger = {
  info: function() {},
  debug: function() {},
  error: function() {}
};

// Replacement for chromes promise API
global.Promise = require("promise");

global.Storage = require("../src/js/global/storage.js");
global.Utils = require("../src/js/global/utils.js");
