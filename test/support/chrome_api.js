// This will include a stub for all necessary chrome* apis
// usage:
// var chromeApi = require("./chrome_api");
// chromeApi.setConfig("someThing", "someReturnValue");
var chrome = {
  config: {},
  setConfig: function(key, value) {
    this.config[key] = value;
  },
  i18n: {
    getUILanguage: function() {
      return chrome.config.uiLanguage || "en_US";
    }
  },
  runtime: {
    getURL: function(url) {
      return "chrome://" + url;
    }
  }
};

module.exports = chrome;
