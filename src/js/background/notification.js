/*global Testing, Utils */
/*eslint no-unused-vars: [2, "Notification"] */
var Notification = {
  create: function(message, onClickCallback) {
    var formNotificationId = null;
    chrome.notifications.create(Math.random().toString(), {
      "iconUrl": chrome.runtime.getURL("images/icon_48.png"),
      "type": "basic",
      "title": "Form-O-Fill",
      "message": message,
      "isClickable": true
    }, function(notificationId) {
      if(!Utils.isLiveExtension()) {
        Testing.setVar("notification-html", message, "Last Notification HTML");
        Testing.setVar("notification-status", "visible", "Last Notification status");
      }
      formNotificationId = notificationId;
    });

    chrome.notifications.onClicked.addListener(function (notificationId) {
      if(notificationId === formNotificationId) {
        if(!Utils.isLiveExtension()) {
          Testing.setVar("notification-status", "clicked", "Last Notification status");
        }
        onClickCallback();
      }
    });
  }
};
