/* global Storage, Utils */
var Workflows = {
  load: function() {
    return new Promise(function (resolve) {
      Storage.load(Utils.keys.workflows).then(function loadRawWorkflows(workflowData) {
        resolve(workflowData || []);
      });
    });
  },
  save: function(workflowData) {
    return Storage.save(workflowData, Utils.keys.workflows);
  }
};

