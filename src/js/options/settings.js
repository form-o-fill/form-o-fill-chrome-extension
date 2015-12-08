/*global jQuery Rules JSONF ImportExport Utils */
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
    reevalRules: document.querySelector("#settings-reeval-rules").checked,
    importActive: document.querySelector("#settings-activate-import-source-url").checked,
    importUrl: document.querySelector("#settings-import-source-url").value
  };

  // Allow overwriting of atributes
  if(typeof overwrites === "object") {
    Object.keys(overwrites).forEach(function(key) {
      currentSettings[key] = overwrites[key];
    });
  }

  // remove shadow storage when saving with checkbox disabled
  if(currentSettings.importActive !== true) {
    Storage.delete(Utils.keys.shadowStorage);
  }

  this.getBg(function(bgWindow) {
    bgWindow.setSettings(currentSettings);
  });

  jQuery(".notice").hide();
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

  // Bind to validate button
  document.querySelector("#settings").addEventListener("click", function(evt) {
    if( evt.target && evt.target.classList.contains("validate-import-source-url") ||
       (evt.target.id === "settings-activate-import-source-url" && evt.target.checked)) {
      settings.validateAndImport();
    }
  });
};

// Validate the URL the user has entered
Settings.prototype.validateAndImport = function() {
  var url = document.querySelector("#settings-import-source-url").value;
  var settings = this;

  document.querySelector("#settings-activate-import-source-url").checked = true;
  settings.saveSettings();

  // Simple base test for URL validity
  if(/^https?:\/\/.*\.js(on)?$/i.test(url)) {
    // Valid URL
    jQuery.ajax({url: url, dataType: "text"})
      .done(function(dataAsString) {
        settings.importFetchSuccess(dataAsString, url);
      })
      .fail(function(jqXhr, textStatus) {
        settings.importFetchFail(url, jqXhr, textStatus);
      });
  } else {
    document.querySelector("#settings-activate-import-source-url").checked = false;
    settings.saveSettings();
    jQuery(".settings-error-url").show();
  }
};

Settings.prototype.importFetchSuccess = function(dataAsString, url) {
  var toImport = JSONF.parse(dataAsString);
  if(Rules.validateImport(toImport)) {

    var counts = {
      workflows: 0,
      rules: 0
    };
    if(typeof toImport.workflows !== "undefined" && typeof toImport.workflows.length !== "undefined") {
      counts.workflows = toImport.workflows.length;
    }
    counts.rules = toImport.rules.rules.length;

    // Valid format
    ImportExport.importRemoteRules(toImport).then(function() {
      jQuery(".notice.import-remote-ready")
      .find(".imp-wfs-count")
      .text(counts.workflows)
      .end()
      .find(".imp-rules-count")
      .text(counts.rules)
      .end()
      .find(".imp-rules-url")
      .text(url)
      .attr("href", url)
      .end()
      .show();
    });

  } else {
    document.querySelector("#settings-activate-import-source-url").checked = false;
    this.saveSettings();
    jQuery(".import-remote-fail-format").show();
  }
};

// When the import failed XHR wise
Settings.prototype.importFetchFail = function(url, jqXhr, textStatus) {
  document.querySelector("#settings-activate-import-source-url").checked = false;
  this.saveSettings();
  jQuery(".import-remote-fail-fetch")
  .find(".imp-fail-fetch-msg")
  .text("status: " + jqXhr.status + ", textStatus: " + textStatus)
  .end()
  .find(".imp-fail-fetch-url")
  .attr("href", url)
  .end()
  .show();
};

Settings.prototype.applySettings = function(options) {
  document.querySelector("#settings-always-show-popup").checked = options.alwaysShowPopup;
  document.querySelector("#settings-reeval-rules").checked = options.reevalRules;
  document.querySelector("#settings-activate-import-source-url").checked = options.importActive;
  document.querySelector("#settings-import-source-url").value = options.importUrl;
  document.querySelector("#settings-screenshot-quality").value = options.jpegQuality;
  document.querySelector(".settings-screenshot-quality-percent").innerHTML = options.jpegQuality;
};

var settings = new Settings();

document.addEventListener("DOMContentLoaded", function() {
  settings.init();
});
