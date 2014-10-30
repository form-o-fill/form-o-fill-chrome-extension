// This file contains the protractor setup for all integration tests
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
    slow: 6000,
    timeout: 20000
  },
  onPrepare: function() {
    // This is run after protractor and mocha/chai is ready.
  }
};
