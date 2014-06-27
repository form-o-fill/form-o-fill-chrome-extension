/*global $, JSONEditor, ace, Storage, Utils, Rules, Rule, I18n, ChromeBootstrap, Editor, JSONF */
/*eslint max-nested-callbacks: 0*/
// This file is a big bag of mixed responsibilities.
// Break this into parts!
//

var editor = new Editor("#ruleeditor-ace");
$(function() {
  var noticesVisible = false;

  I18n.loadPages(["help", "about"]);
  ChromeBootstrap.init();

  editor.on("change", function() {
    // reset notices once the user starts typing again
    if(noticesVisible) {
      $("#ruleeditor .notice").hide();
      noticesVisible = false;
    }
  });

  // A function to display a nice message in the rule editor
  var infoMsg = function(msg) {
    var fadeAfterMSec = 1000;
    var $menuInfo = $(".editor .menu .info");
    $menuInfo.html(msg).css({"opacity": "1"});
    setTimeout(function() {
      $menuInfo.animate({"opacity": 0}, 1000, function() {
        $(this).html("");
      });
    }, fadeAfterMSec);
  };

  // Fill with data from storage
  Storage.load().then(function (ruleString) {
    editor.setValue(ruleString, -1);
  });

  // Append text to the end of the rule definitions
  var appendRule = function(prettyRule, responseCallback) {
    // Use
    Rules.load().then(function(rulesFunction) {
      var lines = [];
      if(rulesFunction.length > 0) {
        lines.push(",");
      }
      lines = lines.concat(prettyRule.split("\n"));
      editor.document().insertLines(editor.document().getLength() - 1, lines);
      // Prettify code a little
      editor.session().setValue(Rules.format(editor.session().getValue()));
      editor.scrollToRow(editor.document().getLength());
      responseCallback();
      infoMsg("Rule added on line " + (editor.document().getLength() - 1));
    });
  };

  // Check for freshly extracted rules and show UI
  Storage.load(Utils.keys.extractedRule).then(function (extractedRule) {
    // There are extracted rules
    if (typeof extractedRule !== "undefined") {
      var $notice = $("#ruleeditor .notice.extracted-present");
      $notice.show();
      $("#ruleeditor button.append-extracted").removeAttr("disabled");
      $("#ruleeditor .cmd-append-extracted, #ruleeditor .append-extracted").on("click", function () {
        Utils.log("[options.js] Appending extracted rules to the end of the definition");
        appendRule(extractedRule, function() {
          $("#ruleeditor button.append-extracted").prop("disabled","disabled");
          $notice.hide();
          Storage.delete(Utils.keys.extractedRule);
        });
      });
    }
  });

  // Check for rule filling errors
  Storage.load(Utils.keys.errors).then(function (errorsStorage) {
    if(typeof errorsStorage !== "undefined") {
      var rule = errorsStorage.rule;
      var errors = errorsStorage.errors;
      var $notice = $("#ruleeditor .notice.form-fill-errors");
      var tableTrs = [];
      errors.forEach(function (error) {
        tableTrs.push("<tr><td>" + error.selector + "</td><td>" + error.value + "</td><td>" + error.message + "</td></tr>");
      });
      $notice.find("table").append(tableTrs.join("\n"));
      $notice.find(".rule-name").html(rule.nameClean);
      $notice.show();
      Storage.delete(Utils.keys.errors);
    }
  });

  // Save the rules
  var saveRules = function() {
    var errors = Rules.syntaxCheck(editor);
    if(errors.length > 0) {
      errors.forEach(function (errorClass) {
        $("#ruleeditor .notice." + errorClass).show();
      });
      infoMsg("Rules invalid, not saved");
      noticesVisible = true;
    }

    if(editor.cleanUp() && !noticesVisible) {
      $("#ruleeditor .notice").hide();
      Storage.save(editor.getValue()).then(function () {
        infoMsg("Rules saved");
      });
    }
  };

  var loadRules = function() {
    Storage.load().then(function (ruleJson) {
      editor.setValue(ruleJson, -1);
      infoMsg("Rules loaded from disc");
    });
  };

  // Button handling for "save" and "load"
  $(".editor .menu").on("click", "button.save", function () {
    saveRules();
  }).on("click", "button.reload", function () {
    loadRules();
  }).on("click", "button.format", function () {
    editor.format(Rules);
    infoMsg("Rules formatted but not saved");
  });

  // Try to fix the erronous structure of the rules
  $(document).on("click", "a.cmd-fix-var-needed", function() {
    editor.fixRules();
  });

  // Event handler for notices
  $(".notice.form-fill-errors").on("click", function () {
    Storage.delete(Utils.keys.errors);
    $(this).hide();
  });

  $(".notice.extracted-present").on("click", function () {
    Storage.delete(Utils.keys.extractedRule);
    $(this).hide();
  });

  $(".notice.annotations-present, .notice.var-needed").on("click", function () {
    $(this).hide();
  });

});

