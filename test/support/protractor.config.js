// Configure protractor to use mocha and chrome only
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
  }
};
