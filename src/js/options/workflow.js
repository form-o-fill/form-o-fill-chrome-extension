/* global Workflows jQuery Rules*/
var workflows = [];

var emptyWorkflow = {
  name: "new workflow",
  steps: []
};

var stepHtml = function(text) {
  return '<li>' + text + '<button class="wf-delete-step">remove step</button></li>';
};

var ruleHtml = function(rule) {
  return '<option data-rule-name="' + rule.name + '" data-rule-id="' + rule.id + '">' + rule.nameClean + '</option>';
};

// Create a new workflow
var createWorkflow = function () {
  jQuery(".wf-name").val(emptyWorkflow.name);
  jQuery("#workfloweditor ol li").remove();
  jQuery("#workfloweditor").show();
  jQuery(".wf-name").trigger("focus").select();
};

var fillRuleSelect = function(rules) {
  jQuery(".rulelist").html(rules.map(ruleHtml).join(""));
};

var addStepToWorkflow = function () {
  var ruleName = jQuery(".rulelist option:selected").data("ruleName");
  if(typeof ruleName !== "undefined") {
    jQuery("#workfloweditor ol").append(stepHtml(ruleName));
  }
};

/* load available rules and fill select field */
Rules.all().then(function availableRules(rules) {
  jQuery(".rulelist option").remove();
  fillRuleSelect(rules);
});

jQuery(function () {
  /* Load all present workflows and fill select field */
  Workflows.load().then(function loadWf(rawWorkflows) {
    workflows = rawWorkflows;

    var $wfSelect = jQuery(".wf-all select");
    var optionHtml = [];

    if(rawWorkflows.length === 0) {
      optionHtml.push("<option class='wf-no-created'>no workflow defined</option>");
    } else {
      optionHtml = optionHtml.concat(rawWorkflows.map(function optionHtmlMap(wfData) {
        return "<option>" + wfData.name + "</option>";
      }));
    }
    $wfSelect.html(optionHtml.join());
  });

  /* 'create workflow' button */
  jQuery(".wf-add-wf").on("click", createWorkflow);

  /* 'add to workflow' button */
  jQuery(".wf-add-step").on("click", addStepToWorkflow);

  /* 'remove step' buttons */
  jQuery(document).on("click", ".wf-delete-step", function wfDeleteStep() {
    jQuery(this).parent().remove();
  });
});
