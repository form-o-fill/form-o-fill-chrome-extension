/* global Workflows jQuery Rules Logger Utils*/
var workflows = [];

// an empty workflow
var emptyWorkflow = {
  id: 0,
  name: "new workflow",
  steps: []
};

// generate a step html
var stepHtml = function(text) {
  return '<li data-step-name="' + text + '">' + text + '<button class="wf-delete-step">remove step</button></li>';
};

// generate a rule
var ruleHtml = function(rule) {
  return '<option data-rule-name="' + rule.name + '" data-rule-id="' + rule.id + '">' + rule.nameClean + '</option>';
};

// Create a new workflow
var createWorkflow = function () {
  jQuery(".wf-name").val(emptyWorkflow.name);
  jQuery("#workfloweditor ol li").remove();
  jQuery("#workfloweditor").show().data("workflowId", 0);
  jQuery(".wf-name").trigger("focus").select();
  jQuery(".wf-all select").append("<option data-workflow-id='0' selected>new workflow (unsaved)</option>");
};

// fill the form with workflow data
var fillWorkflow = function(data) {
  var stepsHtml = [];
  jQuery("#workfloweditor").show().data("workflowId", data.id);
  jQuery(".wf-name").val(data.name);
  jQuery.makeArray(data.steps).forEach(function dataStep(step) {
    stepsHtml.push(stepHtml(step));
  });
  jQuery("#workfloweditor ol li").remove();
  jQuery("#workfloweditor ol").html(stepsHtml.join(""));
};

// fill the ruleslist HTML
var fillRuleSelect = function(rules) {
  jQuery(".rulelist").html(rules.map(ruleHtml).join(""));
};

// Add selected rule as workflow step
var addStepToWorkflow = function() {
  var ruleName = jQuery(".rulelist option:selected").data("ruleName");
  if(typeof ruleName !== "undefined") {
    jQuery("#workfloweditor ol").append(stepHtml(ruleName));
  }
};

// load available rules and fill select field
Rules.all().then(function availableRules(rules) {
  jQuery(".rulelist option").remove();
  fillRuleSelect(rules);
});

// Read steps from HTML
var currentWfSteps = function() {
  return jQuery("#workfloweditor li").map(function () {
    return this.dataset.stepName;
  });
};

// Find a single workflow by id
var findWorkflowById = function(wfId) {
  var aWf = workflows.filter(function wfFilter(wf) {
    return wf.id === wfId;
  });

  // non found -> shouldn't happen
  if(aWf.length === 0) {
    return null;
  }
  return aWf[0];
};

// Load a single worflow into the form
var loadWorkflowById = function(wfId) {
  var aWf = findWorkflowById(wfId);

  // non found -> shouldn't happen
  if(!aWf) {
    return null;
  }

  // fill form
  Logger.info("[o/workflow.js] Loading WF #" + aWf.id + " '" + aWf.name + "'");
  fillWorkflow(aWf);
};

// Load all present workflows and fill select field
var loadWorkflows = function(selectedWfId) {
  Workflows.load().then(function loadWf(rawWorkflows) {
    // When no workflows are defined, exit early
    if(typeof rawWorkflows === "undefined") {
      return;
    }

    workflows = rawWorkflows;

    // if no selectedWfId is set select first
    if(!selectedWfId) {
      selectedWfId = workflows[0].id;
    }

    // Fill the <select> with present workflows
    var $wfSelect = jQuery(".wf-all select");
    var optionHtml = [];
    var selected = null;

    if(rawWorkflows.length === 0) {
      optionHtml.push("<option data-workflow-id='0' class='wf-no-created'>no workflow defined</option>");
      jQuery("#workfloweditor").hide();
    } else {
      optionHtml = optionHtml.concat(rawWorkflows.map(function optionHtmlMap(wfData) {
        selected = wfData.id == selectedWfId ? "selected" : "";
        return "<option " + selected + " data-workflow-id='" + wfData.id + "'>" + wfData.name + " (#" + wfData.id + ")</option>";
      }));
    }
    $wfSelect.html(optionHtml.join());

    if(selectedWfId !== 0) {
      // Load a preset workflow
      fillWorkflow(loadWorkflowById(selectedWfId));
    }
  });
};

// Save a workflow
var saveWorkflow = function() {
  var currentWfId = parseInt(jQuery("#workfloweditor").data("workflowId"), 10);

  var workflow = {
    id: currentWfId,
    name: jQuery(".wf-name").val(),
    steps: currentWfSteps()
  };

  if(currentWfId === 0) {
    // Save a brand new workflow
    workflow.id = workflows.length + 1;
    currentWfId = workflow.id;

    workflows.push(workflow);
  } else {
    // Save a modified workflow
    workflows.forEach(function wfForEach(wf, index) {
      if(wf.id === currentWfId) {
        workflows[index] = workflow;
      }
    });
  }
  Workflows.save(workflows);
  Logger.info("[o/workflow.js] Saving WF {id: " + workflow.id + "; name: " + workflow.name + "; steps#: " + workflow.steps.length + "} = " + workflows.length + " total");

  // reload workflows
  jQuery("#workfloweditor").data("workflowId", currentWfId);
  loadWorkflows(currentWfId);

  Utils.infoMsg("Workflow #" + workflow.id + " saved");
};

// delete a workflow
var deleteWorkflow = function() {
  var currentWfId = parseInt(jQuery("#workfloweditor").data("workflowId"), 10);

  // remove selected workflow from array
  workflows = workflows.filter(function delWfFilter(wf) {
    return currentWfId != wf.id;
  });

  // reorder
  workflows = workflows.map(function delWfMap(wf, index) {
    wf.id = index + 1;
    return wf;
  });

  Workflows.save(workflows).then(loadWorkflows);

  Utils.infoMsg("Workflow #" + currentWfId + " deleted");
};

// on init
jQuery(function () {
  // Load all workflows
  loadWorkflows();

  // 'create workflow' button
  jQuery(".wf-add-wf").on("click", createWorkflow);

  // 'add to workflow' button
  jQuery(".wf-add-step").on("click", addStepToWorkflow);

  // 'remove step' buttons
  jQuery(document).on("click", ".wf-delete-step", function wfDeleteStep() {
    Utils.infoMsg("Rule removed");
    jQuery(this).parent().remove();
  });

  // Save workflow button
  jQuery(".wf-button-save").on("click", saveWorkflow);

  // Delete workflow
  jQuery(".wf-button-delete").on("click", deleteWorkflow);

  // select a workflow from the list
  jQuery(".wf-all select").on("change", function() {
    loadWorkflowById(jQuery(".wf-all option:checked").data("workflowId"));
  });
});
