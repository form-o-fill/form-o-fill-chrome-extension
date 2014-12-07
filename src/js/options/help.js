/* global jQuery, I18n */

// Lets experiment with jQuery custom events :)
// See also i18n.js
jQuery(document).on("i18n-loaded", function (event, pageName) {
  if (pageName.indexOf("help_") > -1) {
    I18n.loadPages(["help-capture", "help-filling", "help-editor", "help-basic", "help-functions", "help-libraries", "help-ownlibraries", "help-before", "help-beforecontext", "help-sharedrules"], "help-content");
  }
});
