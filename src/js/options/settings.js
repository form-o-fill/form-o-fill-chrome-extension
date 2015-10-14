/*global Utils Logger */
var Settings = function() {
  this.settings = null;
};

Settings.prototype.init = function() {
  this.bindHandlers();
  this.loadSettings();
  this.listen();
};

Settings.prototype.get = function(key) {
  return this.settings[key];
};

Settings.prototype.listen = function() {
  var settings = this;
  chrome.runtime.onMessage.addListener(function(request) {
    if(request.action === "toggleSetting" && request.message) {
      Logger.info("[settings.js] received toggleSetting for " + request.message + ". currently : " + settings.get(request.message));
      var msg = {};
      msg[request.message] = !settings.get(request.message);
      settings.saveSettings(msg);
      settings.loadSettings();
    }
  });
};

Settings.prototype.loadSettings = function() {
  var settings = this;
  Storage.load(Utils.keys.settings).then(function(currentSettings) {
    if(typeof currentSettings === "undefined") {
      currentSettings = Utils.defaultSettings;
    }
    settings.settings = currentSettings;

    settings.applySettings();
    settings.sendToBg(currentSettings);
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

Settings.prototype.sendToBg = function(currentSettings) {
  chrome.runtime.sendMessage({action: "setSettings", message: currentSettings});
};

Settings.prototype.saveSettings = function(overwrites) {
  var currentSettings = {
    alwaysShowPopup: document.querySelector("#settings-always-show-popup").checked,
    jpegQuality: document.querySelector("#settings-screenshot-quality").value,
    reevalRules: document.querySelector("#settings-reeval-rules").checked
  };

  // ALlow overwriting of atributes
  if(typeof overwrites === "object") {
    Object.keys(overwrites).forEach(function(key) {
      currentSettings[key] = overwrites[key];
    });
  }

  this.sendToBg(currentSettings);
  Storage.save(currentSettings, Utils.keys.settings);
};

Settings.prototype.bindHandlers = function() {
  var settings = this;
  document.querySelector("#settings").addEventListener("change", function(evt) {
    if(evt.target && evt.target.nodeName === "INPUT") {

      if(evt.target.id === "settings-screenshot-quality") {
        document.querySelector(".settings-screenshot-quality-percent").innerHTML = evt.target.value;
      }

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

  if(this.settings.reevalRules === true) {
    document.querySelector("#settings-reeval-rules").checked = true;
  }

  document.querySelector("#settings-screenshot-quality").value = this.settings.jpegQuality;
  document.querySelector(".settings-screenshot-quality-percent").innerHTML = this.settings.jpegQuality;
};

var settings = new Settings();

document.addEventListener("DOMContentLoaded", function() {
  settings.init();
});
