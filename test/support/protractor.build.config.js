var config = require("./protractor.src.config.js").config;

// Use extension from "build" directory
config.capabilities.chromeOptions.args = [ "load-extension=build", "enable-embedded-extension-options" ];
exports.config = config;
