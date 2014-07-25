/*global jQuery, FormExtractor, Storage, Logger, Utils*/

// Create HTML overlays for form masking
var getOverlays = function() {
  var overlays = ["<div class='form-o-fill-overlay-cover'></div>"];
  jQuery("form").each(function(index) {
    var $form = jQuery(this);

    // Add an index so we can find the form later
    $form.attr("data-form-o-fill-id", index);

    // Dimensions
    var offset = $form.offset();
    var height = $form.height();
    var width = $form.width();

    // HTML
    var overlay = "<div data-form-o-fill-id='" + index + "' class='form-o-fill-overlay-form' style='top:" + offset.top + "px; left:" + offset.left + "px; width:" + width + "px; height:" + height + "px;'><div class='form-o-fill-overlay-text'>Form-O-Fill:<br />Click in the colored area to extract this form</div></div>";
    overlays.push(overlay);
  });
  return overlays.join();
};

var cleanupOverlays = function() {
  // cleanup
  jQuery("form").each(function () {
    jQuery(this).removeAttr("form-o-fill-id");
  });
  jQuery(".form-o-fill-overlay-form, .form-o-fill-overlay-cover").remove();
  jQuery(document).off("click", ".form-o-fill-overlay-form").off("click", "body");
};

var extractRules = function(targetForm) {
  // looks good, start extraction
  var ruleCode = FormExtractor.extract(targetForm);
  Logger.info("[extract_instr.js] Extracted: " + JSON.stringify(ruleCode));

  // Save Rule and goto options.html
  Storage.save(ruleCode, Utils.keys.extractedRule);

  // This is just to try out notification :)
  chrome.runtime.sendMessage({ "action": "extractFinishedNotification"});
};

// This is a one-off message listener
chrome.runtime.onMessage.addListener(function (message, sender, responseCallback) {
  // Request to start extracting a form to rules
  if (message && message.action === "showExtractOverlay") {
    // Add event listener to DOM
    jQuery(document).on("click", ".form-o-fill-overlay-form", function (e) {
      e.preventDefault();
      e.stopPropagation();

      // This is the form we must extract
      var targetForm = document.querySelector("form[data-form-o-fill-id='" + this.dataset.formOFillId + "']");

      // remove overlays etc
      cleanupOverlays();

      if(targetForm) {
        extractRules(targetForm);
      }
    }).on("click", "body", function () {
      cleanupOverlays();
    }).on("keyup", function(e) {
      if(e.which === 27) {
        cleanupOverlays();
      }
    });

    // Attach overlays to DOM
    jQuery("body").append(getOverlays());
  }

  // Request to return the HTML
  if (message && message.action === "getContent") {
    responseCallback(document.querySelector("body").outerHTML);
  }
});
