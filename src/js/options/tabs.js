/*global Logger, jQuery*/
jQuery(function () {
  jQuery(document).on("click", ".tab", function (e) {
    e.preventDefault();
    var $current = jQuery(".tab.current");
    var $this = jQuery(this);
    if ($current.data("tab-id") == $this.data("tab-id")) {
      Logger.info("[tabs.js] Selected currently active tab show rename field");
      $this.find("input").removeAttr("disabled").trigger("focus");
    } else {
      $current.removeClass("current");
      $this.addClass("current");
    }
  }).on("click", "body", function () {
    // Handle body click: Save tab names!
    Logger.info("[tabs.js] Saving tab names!");
  });
});
