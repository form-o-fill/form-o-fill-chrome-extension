// "hotkey-action-fill-with-rule-1"
// "hotkey-action-show-extract-overlay"
chrome.commands.onCommand.addListener(function(command) {
  console.log("Command:", command);
});
