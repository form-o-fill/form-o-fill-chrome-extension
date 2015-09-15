/*global Utils*/
var Settings = function() {
  this.settings = {};
};

Settings.prototype.init = function() {
  this.bindHandlers();
  this.loadSettings();
};

Settings.prototype.get = function(key) {
  return this.settings[key];
};

Settings.prototype.loadSettings = function() {
  var settings = this;
  Storage.load(Utils.keys.settings).then(function(currentSettings) {
    if(typeof currentSettings === "undefined") {
      currentSettings = {
        alwaysShowPopup: false
      };
    }
    settings.settings = currentSettings;

    settings.applySettings();
  });
};

Settings.prototype.showInfo = function(msg) {
  var settings = this;
  var $info = document.querySelector("li.info");
  $info.innerHTML = msg;

  if(typeof this.infoShown === "undefined" || this.infoShown === false) {
    setTimeout(function() {
      settings.infoShown = false;
      $info.innerHTML = "";
    }, 2000);
    this.infoShown = true;
  }
};

Settings.prototype.saveSettings = function() {
  var currentSettings = {
    alwaysShowPopup: document.querySelector("#settings-always-show-popup").checked
  };
  Storage.save(currentSettings, Utils.keys.settings);
};

Settings.prototype.bindHandlers = function() {
  var settings = this;
  document.querySelector("#settings").addEventListener("change", function(evt) {
    if(evt.target && evt.target.nodeName === "INPUT") {
      settings.saveSettings();
      settings.showInfo("Settings saved");
      evt.preventDefault();
    }
  });
};

Settings.prototype.applySettings = function() {
  if(this.settings.alwaysShowPopup === true) {
    document.querySelector("#settings-always-show-popup").checked = true;
  }
};

var settings = new Settings();

document.addEventListener("DOMContentLoaded", function() {
  settings.init();
});
