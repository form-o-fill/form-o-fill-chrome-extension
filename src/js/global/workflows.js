/*eslint no-unused-vars:0 */
import Logger from "../debug/logger";
import Utils from "../global/utils";
import JSONF from "../global/jsonf";
import jQuery from "jquery";

var Workflows = {
  load: function() {
    return new Promise(function (resolve) {
      Storage.load(Utils.keys.workflows).then(function prWfLoad(workflows) {
        if(typeof workflows === "undefined") {
          resolve([]);
        } else {
          resolve(workflows);
        }
      });
    });
  },
  findById: function(id) {
    return new Promise(function (resolve) {
      Workflows.load().then(function prFindById(wfs) {
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

      Workflows.load().then(function prMatchesForRules(workflows) {
        var matchingWorkflows = workflows.filter(function cbWfFilter(workflow) {
          return matchingRuleNames.indexOf(workflow.steps[0]) === 0;
        });
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
          workflow.steps = jQuery.makeArray(workflow.steps);
          return workflow;
        });

        resolve(workflowData);
      });
    });
  }
};

module.exports = Workflows;
