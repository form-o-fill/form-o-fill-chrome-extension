/*global beforeEach browser*/
// This file is run before all other specs
// mocha is already global here
var fs = require('fs');

global.chai = require("chai");
global.chai.use(require("sinon-chai"));
global.chai.use(require("chai-as-promised"));
global.expect = require("chai").expect;
global.manifest = require('../../src/manifest');

// abstract writing screen shot to a file
global.writeScreenShot = function(data, filename) {
  var stream = fs.createWriteStream(filename);
  stream.write(new Buffer(data, 'base64'));
  stream.end();
};

beforeEach(function() {
  browser.ignoreSynchronization = true;
});
