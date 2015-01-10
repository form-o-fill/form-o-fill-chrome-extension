/* global Storage, Utils, Logger */
/*eslint no-unused-vars:0 */
var Workflows = {
  load: function() {
    Logger.info("[g/workflow.js] Loading workflows");
    return Storage.load(Utils.keys.workflows);
  },
  save: function(workflowData) {
    Logger.info("[g/workflow.js] Saving " + workflowData.length + " workflows");
    return Storage.save(workflowData, Utils.keys.workflows);
  },
  delete: function(workflowId) {
    this.load().then(function(workflows) {
      var newWfs = workflows.filter(function wfFilterDel(wf) {
        return wf.id != workflowId;
      });
      Workflows.save(newWfs);
    });
  }
};

