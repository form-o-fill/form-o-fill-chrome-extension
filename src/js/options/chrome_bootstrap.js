/*global jQuery */
/*eslint no-unused-vars: 0*/
var ChromeBootstrap = {
  init: function() {
    // Menu functionality for chrome-bootstrap
    jQuery('.menu').on("click", "a", function(ev) {
      if(this.classList.contains("no-click")) {
        ev.preventDefault();
        return false;
      }
      jQuery('.mainview > *').removeClass("selected");
      jQuery('.menu li').removeClass("selected");
      jQuery('.mainview > *:not(.selected)').css('display', 'none');

      var $parent = jQuery(ev.currentTarget).parent();
      $parent.addClass("selected");

      var anchor = jQuery(ev.currentTarget).attr('href');
      var currentView = jQuery(anchor);
      currentView.css('display', 'block');
      currentView.addClass("selected");

      $parent.parent()[0].className = "menu " + anchor.substr(1);

      jQuery('body')[0].scrollTop = 0;
    });

    // Activate navigationitem via hashtag
    jQuery(window).on("load", ChromeBootstrap.relocate);

    jQuery(document).on("click", "a[href*=#help-]", function() {
      ChromeBootstrap.relocate(this.href.replace(/^.*#/, "#"));
    });

    jQuery(document).on("click", "a.activate-menu", ChromeBootstrap.relocate);

    jQuery(".menu a").on("click", function() {
      if(this.classList.contains("no-click")) {
        return false;
      }

      jQuery(".notice").hide();
    });
  },
  relocate: function(target) {
    var hash = window.location.hash;

    if (typeof target === "string") {
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
  }
};
