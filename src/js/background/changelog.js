/*eslint no-unused-vars: 0 */
var Changelog = {
  changes: {
    "1.6.1": {
      title: "Workflows have arrived!",
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
