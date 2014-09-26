var path = require("path");
var fs = require("fs");

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

// Absolute path to test directory
global.testRoot = path.normalize(__dirname);

// Load the source into a string so they
// can be used with jsdom as "src" option
var sources = {
  jQuery: fs.readFileSync(testRoot + '/support/jquery.js').toString(),
  i18n: fs.readFileSync(testRoot + '/../src/js/global/i18n.js').toString(),
  chrome: fs.readFileSync(testRoot + '/support/chrome_api.js').toString()
};
global.sources = sources;
