var State = function State() {
  this.testingMode = false;
  this.lastActiveTab = null;
  this.currentRuleMetadata = null;
  this.optionSettings = undefined; //TODO: (FS, 2015-12-20) should be own object
};

State.prototype.getTestingMode = function() {
  return this.testingMode;
};

State.prototype.setTestingMode = function(value) {
  this.testingMode = value;
};

State.prototype.getLastActiveTab = function() {
  return this.lastActiveTab;
};

State.prototype.getLastActiveTabId = function() {
  return this.lastActiveTab.id;
};

State.prototype.setLastActiveTab = function(value) {
  this.lastActiveTab = value;
};

State.prototype.getCurrentRuleMetadata = function() {
  return this.currentRuleMetadata;
};

State.prototype.setCurrentRuleMetadata = function(value) {
  this.currentRuleMetadata = value;
};

State.prototype.getOptionSettings = function() {
  return this.optionSettings;
};

State.prototype.setOptionSettings = function(value) {
  this.optionSettings = value;
};

State.prototype.setOption = function(key, value) {
  this.optionSettings[key] = value;
};

module.exports = new State();
