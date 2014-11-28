/*global jQuery */
/*eslint no-unused-vars: 0*/
var ChromeBootstrap = {
  init: function() {
    // Menu functionality for chrome-bootstrap
    jQuery('.menu').on("click", "a", function(ev) {
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

    var relocate = function(target) {
      var hash = window.location.hash;

      if (typeof target !== "undefined") {
        hash = target;
      }

      if (hash) {
        var main = hash.replace(/-.*$/, "");
        var sub = hash.replace(/^.*?-/, "");
        var $nav = jQuery(".navigation a[href='" + main + "']");
        if ($nav.length === 1) {
          $nav.trigger("click");
        }

        // Activate sub-item
        if (sub !== "") {
          window.location.hash = "#help";
          window.location.hash = hash;
        }
      }
    };

    // Activate navigationitem via hashtag
    jQuery(window).on("load", relocate);

    jQuery(document).on("click", "a[href*=#help-]", function() {
      relocate(this.href.replace(/^.*#/, "#"));
    });
  }
};
