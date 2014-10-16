// This file contains the protractor setup and helper code for all integration tests
var fs = require('fs');

global.mocha = require('mocha');
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

// At the end export the protractor config
exports.config = {
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': [
        'load-extension=src',
        'enable-embedded-extension-options'
      ]
    }
  },
  chromeOnly: true,
  framework: 'mocha',
  maxSessions: 1,
  mochaOpts: {
    reporter: "spec",
    slow: 3000,
    timeout: 5000
  },
  onPrepare: function() {
    // This is run after protractor and mocha/chai is ready.
    debugger;
  }
};
