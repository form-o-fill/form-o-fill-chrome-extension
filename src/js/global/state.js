/* eslint no-unused-vars: 0 */
var State = function State() {
  this.testingMode = false;
  this.lastActiveTab = null;
  this.currentRuleMetadata = null;
  this.optionSettings = undefined; //TODO:  (FS, 2015-12-20) should be own object
};

var state = new State();
