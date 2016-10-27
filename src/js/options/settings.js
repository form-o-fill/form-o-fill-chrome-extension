/*global jQuery Utils */
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

    // Force reload settings from storage (called from bg.js)
    if (request.action === "reloadSettings") {
      settings.loadSettings();
    }

    // Save the settings (called from bg.js)
    if (request.action === "saveSettings" && typeof request.message !== "undefined") {
      settings.saveSettings(request.message);
    }
  });
};

Settings.prototype.loadSettings = function() {
  var settings = this;
  settings.getBg(function(bgWindow) {
    settings.applySettings(bgWindow.state.optionSettings);
  });
  settings.updateLastImportDate();
};

// Updates the last import date from shadow storage
Settings.prototype.updateLastImportDate = function() {
  Storage.load(Utils.keys.shadowStorage).then(function(shadowStorage) {
    var importDate = "never";
    if (typeof shadowStorage !== "undefined") {
      importDate = shadowStorage.lastUpdate;
      if (typeof importDate !== "undefined") {
        importDate = new Date(importDate).toLocaleString();
      }
    }
    document.querySelector("#import-source-url-date").innerText = importDate;
  });
};

Settings.prototype.showInfo = function(msg) {
  var settings = this;
  var $info = document.querySelector("li.info");
  $info.innerHTML = msg;

  if (typeof this.infoShown === "undefined" || this.infoShown === false) {
    setTimeout(function() {
      settings.infoShown = false;
      $info.innerHTML = "";
    }, 2000);
    this.infoShown = true;
  }
};

// Get background page (window)
Settings.prototype.getBg = function(cb) {
  chrome.runtime.getBackgroundPage(function(bgWindow) {
    cb(bgWindow);
  });
};

Settings.prototype.saveSettings = function(overwrites) {
  var currentSettings = {
    alwaysShowPopup: document.querySelector("#settings-always-show-popup").checked,
    jpegQuality: document.querySelector("#settings-screenshot-quality").value,
    reevalRules: document.querySelector("#settings-reeval-rules").checked,
    matchOnLoad: document.querySelector("#settings-match-onload").checked,
    dontMatchOnTabSwitch: document.querySelector("#settings-match-tab").checked,
    importActive: document.querySelector("#settings-activate-import-source-url").checked,
    importUrl: document.querySelector("#settings-import-source-url").value,
    decryptionPassword: document.querySelector("#settings-import-source-password").value
  };

  // Allow overwriting of atributes
  if (typeof overwrites === "object") {
    Object.keys(overwrites).forEach(function(key) {
      currentSettings[key] = overwrites[key];
    });
  }

  // remove shadow storage when saving with checkbox disabled
  if (currentSettings.importActive !== true) {
    Storage.delete(Utils.keys.shadowStorage);
  }

  this.getBg(function(bgWindow) {
    bgWindow.setSettings(currentSettings);
  });

  this.updateLastImportDate();

  jQuery(".notice").hide();
};

Settings.prototype.bindHandlers = function() {
  document.querySelector("#settings").addEventListener("change", this.handleChanges.bind(this));
  document.querySelector("#settings").addEventListener("click", this.handleImportClicks.bind(this));
};

Settings.prototype.handleChanges = function(evt) {
  if (evt.target && evt.target.nodeName === "INPUT") {

    // Screenshot quality setting
    if (evt.target.id === "settings-screenshot-quality") {
      document.querySelector(".settings-screenshot-quality-percent").innerHTML = evt.target.value;
    }

    if (evt.target.id === "settings-import-source-url" && document.querySelector("#settings-activate-import-source-url").checked) {
      this.validateAndImport();
    }

    this.saveSettings();
    this.showInfo("Settings saved");
  }
};

Settings.prototype.handleImportClicks = function(evt) {
  //TODO: Bug -> Import works, change url slightly -> must press btn two times ?! (FS, 2015-12-09)
  if (evt.target && evt.target.classList.contains("validate-import-source-url")) {
    this.validateAndImport();
  }
};

// Validate the URL the user has entered
Settings.prototype.validateAndImport = function() {
  var url = document.querySelector("#settings-import-source-url").value;
  var settings = this;

  document.querySelector("#settings-activate-import-source-url").checked = true;
  settings.saveSettings();

  // Simple base test for URL validity
  if (/^https?:\/\/.*\.js(on)?\??.*$/i.test(url)) {
    // Valid URL
    settings.getBg(function(bgWindow) {
      bgWindow.RemoteImport.import(url).then(settings.importFetchSuccess.bind(settings)).catch(settings.importFetchFail.bind(settings));
    });
  } else {
    document.querySelector("#settings-activate-import-source-url").checked = false;
    settings.saveSettings();
    jQuery(".settings-error-url").show();
  }
};

Settings.prototype.importFetchSuccess = function(resolved) {
  var settings = this;
  var toImport = resolved.data;
  var counts = {
    workflows: 0,
    rules: 0
  };

  if (typeof toImport.workflows !== "undefined" && typeof toImport.workflows.length !== "undefined") {
    counts.workflows = toImport.workflows.length;
  }

  counts.rules = toImport.rules.rules.length;

  // Valid format
  settings.getBg(function(bgWindow) {
    bgWindow.RemoteImport.save(toImport).then(function() {
      jQuery(".notice.import-remote-ready")
      .find(".imp-wfs-count")
      .text(counts.workflows)
      .end()
      .find(".imp-rules-count")
      .text(counts.rules)
      .end()
      .find(".imp-rules-url")
      .text(resolved.url)
      .attr("href", resolved.url)
      .end()
      .show();

      settings.updateLastImportDate();
    });
  });
};

// When the import failed XHR wise
Settings.prototype.importFetchFail = function(rejected) {
  document.querySelector("#settings-activate-import-source-url").checked = false;
  this.saveSettings();

  if (rejected.textStatus === "FORMAT") {
    jQuery(".import-remote-fail-format").show();
  } else if (rejected.textStatus === "PASSWORD_NOT_SET") {
    jQuery(".import-remote-fail-password").show();
  } else if (rejected.textStatus === "PASSWORD_DECRYPT_FAILED") {
    jQuery(".import-remote-fail-decrypt").show();
  } else {
    jQuery(".import-remote-fail-fetch")
    .find(".imp-fail-fetch-msg")
    .text("status: " + rejected.status + ", textStatus: " + rejected.textStatus)
    .end()
    .find(".imp-fail-fetch-url")
    .attr("href", rejected.url)
    .end()
    .show();
  }
};

Settings.prototype.applySettings = function(options) {
  // If options are empty, exit here.
  if (options === {}) {
    return;
  }

  this.current = options;

  document.querySelector("#settings-always-show-popup").checked = options.alwaysShowPopup;
  document.querySelector("#settings-reeval-rules").checked = options.reevalRules;
  document.querySelector("#settings-match-onload").checked = options.matchOnLoad;
  document.querySelector("#settings-match-tab").checked = options.dontMatchOnTabSwitch;
  document.querySelector("#settings-activate-import-source-url").checked = options.importActive;
  document.querySelector("#settings-import-source-url").value = options.importUrl;
  document.querySelector("#settings-import-source-password").value = options.decryptionPassword;
  document.querySelector("#settings-screenshot-quality").value = options.jpegQuality;
  document.querySelector(".settings-screenshot-quality-percent").innerHTML = options.jpegQuality;
};

// Resolves with an object of curent settings
Settings.prototype.exportDataJson = function() {
  var settings = this;
  return new Promise(function(resolve) {
    settings.getBg(function(bgWindow) {
      var options = bgWindow.state.optionSettings;
      // Don't store passwords
      options.decryptionPassword = "undefined";
      resolve(options);
    });
  });
};

var settings = new Settings();

document.addEventListener("DOMContentLoaded", function() {
  settings.init();
});
