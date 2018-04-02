/*global Testing, Utils, Changelog */
/*eslint no-undef:0 */
var Notification = {
  create: function(message, title, onClickCallback) {
    if (title === null) {
      title = "Form-O-Fill";
    }
    chrome.notifications.create(Math.random().toString(), {
      "iconUrl": chrome.runtime.getURL("images/icon_48.png"),
      "type": "basic",
      "title": title,
      "message": message,
      "isClickable": true
    }, function(notificationId) {
      if (!Utils.isLiveExtension()) {
        Testing.setVar("notification-html", message, "Last Notification HTML");
        Testing.setVar("notification-status", "visible", "Last Notification status");
        Testing.setVar("notification-callback", onClickCallback.toString(), "Last Notification click callback");
      }
      setTimeout( function() {
        chrome.notifications.clear(notificationId);
      }, Utils.notificationTimeoutMs);
    });

    chrome.notifications.onClicked.addListener(function () {
      if (!Utils.isLiveExtension()) {
        Testing.setVar("notification-status", "clicked", "Last Notification status");
      }
      onClickCallback();
    });
  },
  forVersion: function(version) {
    var notificationContent = Changelog.findForVersion(version);
    if (notificationContent) {
      Notification.create(notificationContent.message, notificationContent.title, function() {
        if (notificationContent.target.indexOf("http") === 0) {
          chrome.tabs.create({url: notificationContent.target});
        } else {
          Utils.openOptions(notificationContent.target);
        }
      });
    }
  }
};
