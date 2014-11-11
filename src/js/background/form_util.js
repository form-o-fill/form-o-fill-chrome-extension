/* global Utils, Logger, JSONF, Notification, Storage, Rules */
/* eslint no-unused-vars: 0 */
var FormUtil = {
  lastRule: null,
  functionToHtml: function(func) {
    return func.toString().replace(/ /g, "&nbsp;").split("\n").join("<br />");
  },
  _findImport: function (ruleName) {
    return new Promise(function (resolve) {
      Rules.all().then(function (rules) {
        var ruleToImport = rules.filter(function (aRule) {
          return aRule.name === ruleName;
        })[0];
        resolve(ruleToImport || null);
      });
    });
  },
  resolveImports: function(rule) {
    return new Promise(function (resolve) {
      // Find field definitions containing the "import" property and
      // lookup the matching rule.
      // Returns an array of promises
      // FormUtil.resolveImports({"fields": [{"import": "shared rules (sharing)"},{"selector": "input"}]}).then(function(rule) { console.dir(rule); });
      var importableRulesPromises = rule.fields.filter(function (fieldDef) {
        return typeof fieldDef.import !== "undefined";
      }).map(function (fieldDef) {
        return FormUtil._findImport(fieldDef.import);
      });

      // resolve found shared rules
      Promise.all(importableRulesPromises).then(function(arrayOfRules) {
        var lookup = {};

        // Create a lookup hash
        arrayOfRules.forEach(function (ruleToImport) {
          lookup[ruleToImport.name] = ruleToImport.fields;
        });

        rule.fields.forEach(function (field, fieldIndex) {
          // replace a field with "import" with the corresponding rule
          if(typeof field.import !== "undefined" && typeof lookup[field.import] !== "undefined") {
            rule.fields.splice.apply(rule.fields, [fieldIndex, 1].concat(lookup[field.import]));
          }
        });
        arrayOfRules = null;

        // Resolve that final rule
        resolve(rule);
      });
    });
  },
  applyRule: function(rule, lastActiveTab) {
    this.lastRule = rule;
    var message = null;
    var beforeData;
    var errors = [];

    // Open long standing connection to the tab containing the form to be worked on
    if(typeof lastActiveTab === "undefined") {
      Logger.info("[form_util.js] lastActivetab has gone away. Exiting.");
      return;
    }
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});

    port.postMessage({"action": "showWorkingOverlay"});

    // The context is passed as the second argument to the before function.
    // It represents to environment in which the rule is executed.
    var context = {
      url: Utils.parseUrl(lastActiveTab.url)
    };

    // Default instantaneous resolving promise:
    var beforeFunctions = [function() {
      return new Promise(function(resolve) {
        resolve(null);
      });
    }];

    Logger.info("[form_utils.js] Applying rule " + JSONF.stringify(this.lastRule.name) + " (" + JSONF.stringify(this.lastRule.fields) + ") to tab " + lastActiveTab.id);

    // Utility function to wrap a function in
    // a promise
    var wrapInPromise = function(func) {
      return new Promise(function(resolve) {
        try {
          func(resolve, context);
        } catch (e) {
          Logger.warn("[form_util.js] Got an exception executing before function: " + func);
          Logger.warn("[form_util.js] Original exception: " + e);
          Logger.warn("[form_util.js] Original stack: " + e.stack);

          var error = {
            error: {
              beforeFunction: FormUtil.functionToHtml(func),
              stack: e.stack,
              message: e.message
            }
          };
          resolve(error);
        }
      });
    };

    // Is there a 'before' block with an function or an array of functions?
    if(typeof rule.before === "function") {
      // A single before function
      beforeFunctions = [ wrapInPromise(rule.before) ];
    } else if(typeof rule.before === "object" && typeof rule.before.length !== "undefined") {
      // Assume an array of functions
      beforeFunctions = rule.before.map(function (func) {
        return wrapInPromise(func);
      });
    }

    Logger.info("[form_util.js] set 'before' function to " + JSONF.stringify(beforeFunctions));

    // call either the default - instantaneously resolving Promise (default) or
    // the arrray of before functions defined in the rule.
    Promise.all(beforeFunctions).then(function(data) {
      beforeData = data;

      // beforeData is null when there is no before function defined in the rule definition
      if(beforeData !== null) {
        Logger.info("[form_util.js] Got before data: " + JSONF.stringify(beforeData));

        // Lets see if we got any errors thrown inside the executed before function
        var filteredErrors = beforeData.filter(function (beforeFunctionData) {
          return beforeFunctionData && beforeFunctionData.hasOwnProperty("error");
        });

        if (filteredErrors.length > 0) {
          // Produce error objects compatible to those used for form filling errors
          errors = filteredErrors.map(function (errorObj) {
            return { selector: "Inside before function", value: errorObj.error.beforeFunction, message: errorObj.error.message };
          });

          Notification.create("An error occured while executing a before function. Click here to view it.", function() {
            // Save the errors to local storage
            Storage.save({"errors": errors, "rule": rule}, Utils.keys.errors).then(function () {
              Utils.openOptions();
            });
          });
        }

      }

      // If there was only one rule
      // reduce data array to one element
      if(beforeData.length === 1) {
        beforeData = beforeData[0];
      }

      // Check for rules to import (shared rules)
      //rule = FormUtil.resolveImports(rule);

      // Now send all field definitions to the content script
      rule.fields.forEach(function (field) {
        message = {
          "action": "fillField",
          "selector": field.selector,
          "value": JSONF.stringify(field.value),
          "beforeData": beforeData
        };
        port.postMessage(message);
        Logger.info("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
      });

      // Get errors. Receiver is in content.js
      Logger.info("[form_util.js] Posted to content.js: 'getErrors'");
      port.postMessage({"action": "getErrors"});
    });

    var reportErrors = function(errors) {
      Logger.warn("[form_util.js] Received 'getErrors' with " + errors.length + " errors");
      if(errors.length > 0) {
        Notification.create("There were " + errors.length + " errors while filling this form. Click here to view them.", function() {
          // Save the errors to local storage
          Storage.save({"errors": errors, "rule": rule}, Utils.keys.errors).then(function () {
            // Open options and forward the messages to options.js
            Utils.openOptions();
          });
        });
      }
      port.postMessage({"action": "hideWorkingOverlay"});
    };

    port.onMessage.addListener(function (message) {
      // Make errors from content scripts available here
      if(message.action === "getErrors") {
        var sentErrors = JSONF.parse(message.errors);
        reportErrors(sentErrors);
      }
    });
  }
};
