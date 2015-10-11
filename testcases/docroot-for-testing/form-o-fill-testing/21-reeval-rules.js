jQuery(function() {
  jQuery(".clickme").on("click", function() {
    jQuery('h1').append('<br /><input value="Value from insert" id="target">');
  });
});
