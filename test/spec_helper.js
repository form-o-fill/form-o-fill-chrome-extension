var path = require("path");
var fs = require("fs");

// Expectation Framework
global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.expect = require("chai").expect;

// Sinon for subbing/mocking etc
global.sinon = require("sinon");

// Simulate the DOM inside node
global.jsdom = require("jsdom");

// A stubed chrome API
global.chrome = require("./support/chrome_api.js");

// Absolute path to test directory
global.testRoot = path.normalize(__dirname);

// Load the jquery source into a string so it
// can be used with jsdom as "src" option
// See test/global/i18n_spec.js for an example
var sources = {
  jQuery: fs.readFileSync(testRoot + '/support/jquery.js').toString(),
  i18n: fs.readFileSync(testRoot + '/../src/js/global/i18n.js').toString(),
  chrome: fs.readFileSync(testRoot + '/support/chrome_api.js').toString()
};
global.sources = sources;
