import * as Utils from "../global/utils";
import * as Logger from "../debug/logger";

class Alarm {
  static install() {
    // Create an "alarm" which will be called every 15 minutes in prod and every other minute in dev
    // https://developer.chrome.com/extensions/alarms
    chrome.alarms.clear(Utils.alarmName);
    Logger.info(
      `[bg.js] Installing alarm to trigger every ${Utils.alarmIntervalInMinutes} minutes`
    );
    chrome.alarms.create(
      Utils.alarmName,
      { delayInMinutes: Utils.alarmIntervalInMinutes, periodInMinutes: Utils.alarmIntervalInMinutes}
    );
  }
}

module.exports = Alarm;
