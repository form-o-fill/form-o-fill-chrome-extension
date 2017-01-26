/* eslint no-unused-vars: 0 */
var State = function State() {
  this.testingMode = false;
  this.lastActiveTab = null;
  this.currentRuleMetadata = null;
  this.optionSettings = {};
  this.decryptionPassword = null;
  this.forceRunOnLoad = false;
  this.ruleRuntime = {
    triggered: "manually",
    partOfWorkflow: false
  };
};

var state = new State();
