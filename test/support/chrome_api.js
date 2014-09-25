// This will include a stub for all necessary chrome* apis
// usage:
// var chromeApi = require("./chrome_api");
// chromeApi.setConfig("someThing", "someReturnValue");
var chrome = {
  config: {},
  i18n: {
    getUILanguage: function() {
      return chrome.config.uiLanguage || "en_US";
    }
  },
  setConfig: function(key, value) {
    this.config[key] = value;
  }
};

module.exports = chrome;
