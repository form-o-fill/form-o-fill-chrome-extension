/* global jQuery */
jQuery(function() {
  jQuery(".clickme").on("click", function() {
    jQuery("form").append(
      '<br /><input value="Value from insert" id="target"><input type="submit" id="startwf" value="start workflow"/>'
    );
  });

  jQuery("#target4").on("click", function() {
    jQuery(this).val("clicked");
  });

  jQuery("#target21").on("click", function() {
    jQuery(this).html("clicked");
  });
});

/*eslint-disable no-unused-vars */
var demoVar = {
  data: 1,
  func: function(a) {
    return a;
  },
};
