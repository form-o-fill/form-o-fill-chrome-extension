/* global Logger Utils */
var Alarm = {
  create: function() {
    // Create an "alarm" which will be called every 15 minutes or so
    // https://developer.chrome.com/extensions/alarms
    chrome.alarms.clear(Utils.alarmName);
    Logger.info("[bg.js] Installing alarm to trigger every " + Utils.alarmIntervalInMinutes + " minutes");
    chrome.alarms.create(Utils.alarmName, { delayInMinutes: Utils.alarmIntervalInMinutes, periodInMinutes: Utils.alarmIntervalInMinutes});
  }
};

// REMOVE START
if (typeof exports === "object") {
  module.exports = Alarm;
}
// REMOVE END
