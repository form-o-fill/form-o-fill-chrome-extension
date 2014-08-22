/* eslint no-unused-vars: 0 */
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
      formNotificationId = notificationId;
    });

    chrome.notifications.onClicked.addListener(function (notificationId) {
      if(notificationId === formNotificationId) {
        onClickCallback();
      }
    });
  }
};
