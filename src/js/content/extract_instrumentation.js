/*global jQuery, FormExtractor, Storage, Logger, Utils, JSONF*/

// Create HTML overlays for form masking
var getOverlays = function getOverlays() {
  var overlays = [];
  jQuery("form").each(function formEach(index) {
    var $form = jQuery(this);

    // Add an index so we can find the form later
    $form.attr("data-form-o-fill-id", index);

    // Dimensions
    var offset = $form.offset();
    var height = $form.height();
    var width = $form.width();

    // HTML
    var overlay = "<div data-form-o-fill-id='" + index + "' class='form-o-fill-overlay-form' style='top:" + offset.top + "px; left:" + offset.left + "px; width:" + width + "px; height:" + height + "px;'><div class='form-o-fill-overlay-text'>Form-O-Fill:<br />" + chrome.i18n.getMessage("extract_click_here") + "</div></div>";
    overlays.push(overlay);
  });
  return overlays.join();
};

var cleanupOverlays = function cleanupOverlays() {
  // cleanup
  jQuery("form").each(function formEach() {
    jQuery(this).removeAttr("form-o-fill-id");
  });
  jQuery(".form-o-fill-overlay-form").remove();
  jQuery(document).off("click", ".form-o-fill-overlay-form").off("click", "body");
};

var extractRules = function extractRules(targetForm) {
  // looks good, start extraction
  var ruleCode = FormExtractor.extract(targetForm);
  Logger.info("[extract_instr.js] Extracted: " + JSON.stringify(ruleCode));

  // Save Rule and goto options.html
  Storage.save(ruleCode, Utils.keys.extractedRule);

  chrome.runtime.sendMessage({ "action": "extractFinishedNotification"});
};

// Show the extract overlay and bind handlers
var showExtractOverlay = function showExtractOverlay() {
  // Add event listener to DOM
  jQuery(document).on("click", ".form-o-fill-overlay-form", function clickFofOverlay(e) {
    e.preventDefault();
    e.stopPropagation();

    // This is the form we must extract
    var targetForm = document.querySelector("form[data-form-o-fill-id='" + this.dataset.formOFillId + "']");

    // remove overlays etc
    cleanupOverlays();

    if (targetForm) {
      extractRules(targetForm);
    }
  }).on("click", "body", cleanupOverlays)
  .on("keyup", function keyUp(e) {
    if (e.which === 27) {
      cleanupOverlays();
    }
  });

  // Attach overlays to DOM
  jQuery("body").append(getOverlays());
};

// This is a one-off message listener
chrome.runtime.onMessage.addListener(function extractInstOnMessage(message, sender, responseCallback) {
  // Request to start extracting a form to rules
  if (message && message.action === "showExtractOverlay") {
    showExtractOverlay();
  }

  // Request to match rules against content
  // Done here to not send the whole HTML to bg.js
  if (message && message.action === "matchContent" && message.rules) {
    var content = document.querySelector("body").outerHTML;
    var matches = [];
    var rules = JSONF.parse(message.rules);
    rules.forEach(function forEach(rule) {
      if (typeof rule.content.test === "function" && rule.content.test(content)) {
        matches.push(rule.id);
      }
    });
    Logger.info("[extract_instr.js] Matched content against " + rules.length + " rules with " + matches.length + " content matches");
    responseCallback(JSONF.stringify(matches));
  }
});
