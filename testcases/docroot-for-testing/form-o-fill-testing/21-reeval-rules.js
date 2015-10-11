/* global jQuery */
jQuery(function() {
  jQuery(".clickme").on("click", function() {
    jQuery('h1').append('<br /><input value="Value from insert" id="target">');
  });

  jQuery(".clickme2").on("click", function() {
    window.location.hash="some/hash/url";
  });
});
