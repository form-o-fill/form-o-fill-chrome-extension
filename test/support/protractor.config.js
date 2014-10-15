exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.43.1.jar',
  capabilities: {
    'browserName': 'chrome'
  },
  chromeOnly: true,
  framework: 'mocha',
  specs: ['test_scene.js']
};
