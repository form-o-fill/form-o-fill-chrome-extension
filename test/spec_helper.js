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

global.Logger = {
  info: function() {}
};
