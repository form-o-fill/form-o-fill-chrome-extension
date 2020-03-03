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
    },
    "2.2.2": {
      title: "FoF updated: Unified export/import!",
      message: "Unified export/import for rules & workflows. See changelog!",
      target: "#changelog"
    },
    "2.3.0": {
      title: "FoF updated: Live tutorials!",
      message: "Learn the features of FoF with the live tutorials. See options.",
      target: "#tutorials"
    },
    "2.3.1": {
      title: "FoF updated: More tutorials!",
      message: "Added tutorials for workflows, context and more. Have a look!",
      target: "#tutorials"
    },
    "2.4.0": {
      title: "FoF updated: Screenshot + onlyEmpty",
      message: "Take screenshots! Fill only empty fields!",
      target: "#help-screenshot"
    },
    "2.5.0": {
      title: "FoF updated: setupContent + auto. rematch",
      message: "prepare function for content! automatic rematch for SPAs!",
      target: "#changelog"
    },
    "2.6.0": {
      title: "FoF updated: remote rules import",
      message: "Import remote rules from any URL. Share your rules with your colleagues.",
      target: "#help-settingsremoterules"
    },
    "3.0.0": {
      title: "Major release 3.0",
      message: "Faster ruleset searching. Please read the blogpost.",
      target: "https://form-o-fill.github.io/releasing-version-3"
    },
    "4.0": {
      title: "Major release 4.0",
      message: "Removal of unwanted permission for compliance",
      target: "#changelog"
    }
  },
  findForVersion: function(version) {
    if (typeof this.changes[version] !== "undefined") {
      return this.changes[version];
    }
    return null;
  }
};
