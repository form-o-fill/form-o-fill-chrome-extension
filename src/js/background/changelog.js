/*eslint no-unused-vars: 0 */
var Changelog = {
  changes: {
    "2.0.0": {
      title: "2.0.0 : Workflows have arrived!",
      message: "Chain rules together to form sequences of actions. Even survives page reload!",
      target: "#workflows"
    },
    "2.2.1": {
      title: "FoF updated: Save data between rules!",
      message: "Save data between rule executions. Ideal for workflows.",
      target: "#help-before-context"
    }
  },
  findForVersion: function(version) {
    if(typeof this.changes[version] !== "undefined") {
      return this.changes[version];
    }
    return null;
  }
};
