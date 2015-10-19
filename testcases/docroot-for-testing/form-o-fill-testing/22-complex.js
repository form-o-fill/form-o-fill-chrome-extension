/* global jQuery */
jQuery(function() {
  jQuery(".clickme").on("click", function() {
    jQuery('form').append('<br /><input value="Value from insert" id="target"><input type="submit" value="start workflow"/>');
  });

  jQuery("#target4").on("click", function() {
    jQuery(this).val("clicked");
  });
});
