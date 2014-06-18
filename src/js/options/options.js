/*global $*/
$(function() {
  $('.menu').on("click", "a", function(ev) {
    ev.preventDefault();
    $('.mainview > *').removeClass("selected");
    $('.menu li').removeClass("selected");
    $('.mainview > *:not(.selected)').css('display', 'none');

    $(ev.currentTarget).parent().addClass("selected");
    var currentView = $($(ev.currentTarget).attr('href'));
    currentView.css('display', 'block');
    currentView.addClass("selected");
    $('body')[0].scrollTop = 0;
  });

  $('.mainview > *:not(.selected)').css('display', 'none');
});
