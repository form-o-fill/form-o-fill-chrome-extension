/* global Workflows jQuery*/
jQuery(function () {
  Workflows.load().then(function loadWf(rawWorkflows) {
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
});
