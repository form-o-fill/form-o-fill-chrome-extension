/*eslint no-unused-vars: 0 */
var Changelog = {
  changes: {
    "2.0.0": {
      title: "2.0.0 : Workflows have arrived!",
      message: "Chain rules together to form sequences of actions. Even survives page reload!",
      target: "#workflows"
    }
  },
  findForVersion: function(version) {
    if(typeof this.changes[version] !== "undefined") {
      return this.changes[version];
    }
    return null;
  }
};
