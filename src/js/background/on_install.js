/*global Utils Logger Rules Alarm loadSettings*/
// Checks to see if tabSettings are initialized
// If not creates a default tabSetting
var initializeTabSettings = function() {
  // Check if tabs are saved or we start from scratch
  Storage.load(Utils.keys.tabs).then(function (tabSettings) {
    // No tab settings found, create one
    if (typeof tabSettings === "undefined") {
      Logger.info("[bg.js] Creating default tab setting");
      Storage.save([{
        "id": 1,
        "name": chrome.i18n.getMessage("tabs_default_name")
      }], Utils.keys.tabs);

      // Initialize rules
      Rules.save(Utils.defaultRule, 1);
    }
  });
};

// Fires when the extension is install or updated
chrome.runtime.onInstalled.addListener(function (details) {
  Logger.info("[bg.js] chrome.runtime.inInstalled triggered");

  // Called on very first install
  if (details.reason === "install") {
    Notification.create(chrome.i18n.getMessage("first_install_notification"), null, function () {
      Utils.openOptions("#help");
    });
  }

  // Initialize tab settings
  initializeTabSettings();

  // remove log entries
  Logger.delete();

  // Check if there are notifications to display
  if (Utils.version.indexOf(".") > -1) {
    Notification.forVersion(Utils.version);
  }

  // load and set settings. Uses defaults if non present.
  loadSettings();

  // This will trigger a re-import of the remote rules set in settings
  Alarm.create();
});
