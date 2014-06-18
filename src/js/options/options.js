/*global $, JSONEditor, ace, RuleStorage, Utils, Rules*/
/*eslint max-nested-callbacks: 0*/
$(function() {

  // Menu functionality for chrome-bootstrap
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

  // Load JSONEditor
  var container = document.getElementById("jsoneditor");
  var editor = new JSONEditor(container, {
    "mode": "code",
    "modes": [ "code" ],
    "search": false,
    "indention": 2
  });

  // Fill with data from storage
  RuleStorage.loadRules().then(function (ruleJson) {
    editor.set(ruleJson);
  });

  // Modify DOM to make room for buttons
  $("#jsoneditor .menu").append("<button class='save'>Save rules</button><button class='reload'>Reload saved rules</button><span class='info'></span>");

  var $menuInfo = $("#jsoneditor .menu .info");

  // A function to disply a nice message in the rule editor
  var infoMsg = function(msg) {
    $menuInfo.html(msg).css({"opacity": "1"});
    setTimeout(function() {
      $menuInfo.animate({"opacity": 0}, 1000, function() {
        $(this).html("");
      });
    }, 1000);
  };

  // Button handling for "save" and "load"
  $("#jsoneditor").on("click", "button.save", function () {
    Rules.save(editor.get()).then(function () {
      infoMsg("Rules saved");
    });
  }).on("click", "button.reload", function () {
    RuleStorage.loadRules().then(function (ruleJson) {
      editor.set(ruleJson);
      infoMsg("Rules loaded from disc");
    });
  });
});
