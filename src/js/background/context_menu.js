/*global jQuery, Logger */

/* Much to be learned here.
 * Simple things can take much longer than expected.
 * The documentation for using the chrome.contextMenus is simple aweful and wrong in some places.
 * You MUST supply an "id" field or the contextmenu will not be shown. Its NOT optional as the doc says.
 * */
var ctxHandleExtractClick = function(menuItem) {
  if(menuItem.menuItemId === "ctxMain") {
    var message = {
      "action": "extractLastClickedForm"
    };

    // Send message to content script
    // to extract last clicked form
    chrome.tabs.query({"active": true, "lastFocusedWindow": true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }
};

chrome.contextMenus.onClicked.addListener(ctxHandleExtractClick);

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    "title": "Form-O-Fill: Save Form",
    "contexts": ["editable", "page", "frame"],
    "id": "ctxMain"
  });
});
