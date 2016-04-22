/* global Storage, Utils, Logger, JSONF $ */
/*eslint no-unused-vars:0 */
var Workflows = {
  all: function() {
    return new Promise(function (resolve) {
      Promise.all([Storage.load(Utils.keys.workflows), Storage.load(Utils.keys.shadowStorage)]).then(function prWfLoad(workflowsAndShadow) {
        if (typeof workflowsAndShadow === "undefined") {
          resolve([]);
        } else {
          var workflows = workflowsAndShadow[0];
          if (typeof workflowsAndShadow[1] !== "undefined" && typeof workflowsAndShadow[1].workflows !== "undefined") {
            workflows = workflows.concat(workflowsAndShadow[1].workflows.map(function(workflow) {
              workflow.shadow = true;
              return workflow;
            }));
          }
          resolve(workflows);
        }
      });
    });
  },
  findById: function(id) {
    return new Promise(function (resolve) {
      Workflows.all().then(function prFindById(wfs) {
        resolve(wfs.filter(function (wf) {
          /*eslint-disable eqeqeq*/
          return wf.id == id;
          /*eslint-enable eqeqeq*/
        })[0]);
      });
    });
  },
  save: function(workflowData) {
    Logger.info("[g/workflow.js] Saving " + workflowData.length + " workflows");
    return Storage.save(workflowData, Utils.keys.workflows);
  },
  delete: function(workflowId) {
    this.load().then(function(workflows) {
      var newWfs = workflows.filter(function wfFilterDel(wf) {
        /*eslint-disable eqeqeq*/
        return wf.id != workflowId;
        /*eslint-enable eqeqeq*/
      });
      Workflows.save(newWfs);
    });
  },
  matchesForRules: function(rules) {
    return new Promise(function (resolve) {
      // Find workflows that match those rules (start only)
      var matchingRuleNames = rules.map(function cbStepsMap(rule) {
        return rule.name;
      });

      Workflows.all().then(function prMatchesForRules(workflows) {
        var matchingWorkflows = [];
        if (typeof workflows !== "undefined") {
          matchingWorkflows = workflows.filter(function cbWfFilter(workflow) {
            return matchingRuleNames.indexOf(workflow.steps[0]) === 0;
          });
        }
        resolve(matchingWorkflows);
      });
    });
  },
  saveMatches: function(workflows) {
    return Storage.save(JSONF.stringify(workflows), Utils.keys.lastMatchingWorkflows);
  },
  loadMatches: function() {
    return new Promise(function (resolve) {
      Storage.load(Utils.keys.lastMatchingWorkflows).then(function (rawMatches) {
        resolve(JSONF.parse(rawMatches));
      });
    });
  },
  exportDataJson: function() {
    return new Promise(function (resolve) {
      Storage.load(Utils.keys.workflows).then(function(workflowData) {

        // Not workflow saved yet.
        if (typeof workflowData === "undefined") {
          resolve([]);
        }

        workflowData = workflowData.map(function cbWfDataMap(workflow) {
          workflow.steps = $.makeArray(workflow.steps);
          return workflow;
        });

        resolve(workflowData);
      });
    });
  }
};

