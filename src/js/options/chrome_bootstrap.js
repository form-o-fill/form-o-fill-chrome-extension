/*global jQuery */
var ChromeBootstrap = {
  init: function() {
    // Menu functionality for chrome-bootstrap
    jQuery('.menu').on("click", "a", function(ev) {
      ev.preventDefault();
      jQuery('.mainview > *').removeClass("selected");
      jQuery('.menu li').removeClass("selected");
      jQuery('.mainview > *:not(.selected)').css('display', 'none');

      jQuery(ev.currentTarget).parent().addClass("selected");
      var currentView = jQuery(jQuery(ev.currentTarget).attr('href'));
      currentView.css('display', 'block');
      currentView.addClass("selected");
      jQuery('body')[0].scrollTop = 0;
    });

    jQuery('.mainview > *:not(.selected)').css('display', 'none');
  }
};
