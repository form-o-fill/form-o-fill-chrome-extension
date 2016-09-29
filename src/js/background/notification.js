/*global Testing, Utils, Changelog */
/*eslint no-undef:0 */
var Notification = {
  create: function(message, title, onClickCallback) {
    var formNotificationId = null;
    if (title === null) {
      title = "Form-O-Fill";
    }
    chrome.notifications.create(Math.random().toString(), {
      "iconUrl": chrome.runtime.getURL("images/icon_48.png"),
      "type": "basic",
      "title": title,
      "message": message,
      "isClickable": true,
      "requireInteraction": false
    }, function(notificationId) {
      if (!Utils.isLiveExtension()) {
        Testing.setVar("notification-html", message, "Last Notification HTML");
        Testing.setVar("notification-status", "visible", "Last Notification status");
        Testing.setVar("notification-callback", onClickCallback.toString(), "Last Notification click callback");
      }
      formNotificationId = notificationId;
      setTimeout( function() {
        chrome.notifications.clear(formNotificationId);
      }, Utils.notificationTimeoutMs);
    });

    chrome.notifications.onClicked.addListener(function (notificationId) {
      if (notificationId === formNotificationId) {
        if (!Utils.isLiveExtension()) {
          Testing.setVar("notification-status", "clicked", "Last Notification status");
        }
        onClickCallback();
      }
    });
  },
  forVersion: function(version) {
    var notificationContent = Changelog.findForVersion(version);
    if (notificationContent) {
      Notification.create(notificationContent.message, notificationContent.title, function() {
        Utils.openOptions(notificationContent.target);
      });
    }
  }
};
