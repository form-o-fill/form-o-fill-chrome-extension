class State {
  constructor() {
    this.testingMode = false;
    this.lastActiveTab = null;
    this.currentRuleMetadata = null;
    this.optionSettings = undefined; //TODO:  (FS, 2015-12-20) should be own object
  }
}

module.exports = new State();
