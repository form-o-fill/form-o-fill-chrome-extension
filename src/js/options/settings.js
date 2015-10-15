var Settings = function() {
};

Settings.prototype.init = function() {
  this.bindHandlers();
  this.loadSettings();
  this.listen();
};

Settings.prototype.listen = function() {
  var settings = this;
  chrome.runtime.onMessage.addListener(function(request) {
    if(request.action === "reloadSettings") {
      settings.loadSettings();
    }
  });
};

Settings.prototype.loadSettings = function() {
  var settings = this;
  settings.getBg(function(bgWindow) {
    settings.applySettings(bgWindow.optionSettings);
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

Settings.prototype.getBg = function(cb) {
  chrome.runtime.getBackgroundPage(function(bgWindow) {
    cb(bgWindow);
  });
};

Settings.prototype.saveSettings = function(overwrites) {
  var currentSettings = {
    alwaysShowPopup: document.querySelector("#settings-always-show-popup").checked,
    jpegQuality: document.querySelector("#settings-screenshot-quality").value,
    reevalRules: document.querySelector("#settings-reeval-rules").checked
  };

  // Allow overwriting of atributes
  if(typeof overwrites === "object") {
    Object.keys(overwrites).forEach(function(key) {
      currentSettings[key] = overwrites[key];
    });
  }

  this.getBg(function(bgWindow) {
    bgWindow.setSettings(currentSettings);
  });
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

Settings.prototype.applySettings = function(options) {
  document.querySelector("#settings-always-show-popup").checked = options.alwaysShowPopup;
  document.querySelector("#settings-reeval-rules").checked = options.reevalRules;
  document.querySelector("#settings-screenshot-quality").value = options.jpegQuality;
  document.querySelector(".settings-screenshot-quality-percent").innerHTML = options.jpegQuality;
};

var settings = new Settings();

document.addEventListener("DOMContentLoaded", function() {
  settings.init();
});
