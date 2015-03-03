/* global Utils, Logger, JSONF, Notification, Storage, Rules */
/* eslint no-unused-vars: 0, complexity: 0 */
var FormUtil = {
  lastRule: null,
  functionToHtml: function functionToHtml(func) {
    return func.toString().replace(/ /g, "&nbsp;").split("\n").join("<br />");
  },
  _findImport: function _findImport(ruleName, ruleNameWithImport) {
    return new Promise(function findImportPromise(resolve) {
      Rules.all().then(function findImportThen(rules) {
        var ruleToImport = rules.filter(function findImportFilter(aRule) {
          return aRule.name === ruleName;
        })[0];
        resolve({
          ruleToImport: (ruleToImport || null),
          ruleThatImports: ruleName
        });
      });
    });
  },
  resolveImports: function resolveImports(rule) {
    return new Promise(function (resolve) {
      // Find field definitions containing the "import" property and
      // lookup the matching rule.
      // Returns an array of promises
      var importableRulesPromises = rule.fields.filter(function importableRulesFilter(fieldDef) {
        return typeof fieldDef.import !== "undefined";
      }).map(function importableRulesMap(fieldDef) {
        return FormUtil._findImport(fieldDef.import, rule.name);
      });

      // resolve found shared rules
      Promise.all(importableRulesPromises).then(function importableRulesPromises(arrayOfRules) {
        var lookup = {};
        if(arrayOfRules.length > 0) {
          Logger.info("[form_util.js] Found importable rules:", arrayOfRules);
        }

        // Check for imports that could not be found
        var missingImports = arrayOfRules.filter(function importWithoutRules(element) {
          return element.ruleToImport === null;
        });

        if(missingImports.length > 0) {
          Notification.create(chrome.i18n.getMessage("notification_import_without_rule"), null, function importWithoutRule() {
            var errors = missingImports.map(function (element) {
              return { fullMessage: "Missing rule is named '" + element.ruleThatImports + "'" };
            });
            FormUtil.saveErrors(errors, rule);
          });
        }

        // revert changes made by importable rules
        arrayOfRules = arrayOfRules.map(function(importRuleConstruct) {
          return importRuleConstruct.ruleToImport;
        });

        // Create a lookup hash
        arrayOfRules.filter(function arrayOfRulesFilter(aRule) {
          return aRule !== null;
        }).forEach(function arrayOfRulesLoop(ruleToImport) {
          lookup[ruleToImport.name] = ruleToImport.fields;
        });

        // If there are no lookup entries
        // we can return here
        if(Object.keys(lookup).length > 0) {
          // Walk through all fields and replace imports with the field definitions
          // from the shared rule
          rule.fields.forEach(function resolveImportsFields(field, fieldIndex) {
            // replace a field with "import" with the corresponding rule
            if(typeof field.import !== "undefined" && typeof lookup[field.import] !== "undefined") {
              // Insert the rules at the "import" spot
              rule.fields.splice.apply(rule.fields, [fieldIndex, 1].concat(lookup[field.import]));
            }
          });
        }

        // Kill reference for GC
        arrayOfRules = null;

        // Resolve that final rule
        resolve(rule);
      });
    });
  },
  saveErrors: function saveErrors(errors, rule) {
    // Save the errors to local storage
    Storage.save({"errors": errors, "rule": rule}, Utils.keys.errors).then(function storageSave() {
      Utils.openOptions();
    });
  },
  displayMessage: function displayMsg(msg, lastActiveTab) {
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});
    port.postMessage({action: "showMessage", message: msg});
  },
  // returns an array of found libraries
  detectLibraries: function(value) {
    var detectedLibs = [];
    Object.keys(Utils.vendoredLibs).forEach(function dtctLib(vLibKey) {
      if(value.match(Utils.vendoredLibs[vLibKey].detectWith) !== null) {
        // Found!
        detectedLibs.push(vLibKey);
      }
    });
    return detectedLibs;
  },
  sendFieldsToContent: function(aRule, beforeData, port) {
    // Now send all field definitions to the content script
    var message;
    aRule.fields.forEach(function ruleFieldsForEach(field) {
      message = {
        "action": "fillField",
        "selector": field.selector,
        "value": JSONF.stringify(field.value),
        "beforeData": beforeData
      };
      port.postMessage(message);
      Logger.info("[form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
    });
  },
  reportErrors: function(theErrors, rule, port) {
    Logger.warn("[form_util.js] Received 'getErrors' with " + theErrors.length + " errors");
    if(theErrors.length > 0) {
      Notification.create("There were " + theErrors.length + " errors while filling this form. Click here to view them.", null, function NotificationCreate() {
        FormUtil.saveErrors(theErrors, rule);
      });
    }
    port.postMessage({"action": "hideWorkingOverlay"});
  },
  injectAndAttachToLibs: function(pathToScript, nameOnLib, nameOnWindow) {
    return new Promise(function (resolve) {
      chrome.tabs.executeScript(null, {file: pathToScript}, function () {
        chrome.tabs.executeScript({code: "Libs.add('" + nameOnLib + "', window." + nameOnWindow + "); console.log(Libs." + nameOnLib + ");"}, function () {
          resolve(pathToScript);
        });
      });
    });
  },
  generateLibsPromises: function(libs) {
    // Inject the libs into the page
    // Build an array starting with an instant resolving promise
    var prUsedLibs = [ new Promise(function (resolve) {
      resolve();
    }) ];

    // There are libraries present
    // so add them to the stack
    if(libs.length > 0) {
      // Generate a promise for every used lib
      libs.forEach(function (libPath) {
        prUsedLibs.push(FormUtil.injectAndAttachToLibs(libPath, Utils.vendoredLibs[libPath].name, Utils.vendoredLibs[libPath].onWindowName));
      });
    }

    return prUsedLibs;
  },
  _grabber: function(lastActiveTabId) {
    // the grabber is passed as part of the context
    // it can fetch content from the open webpage
    // usage: context.findHtml("a.getme").then(function(content) {});
    return function theRealGrabber(selector) {
      return new Promise(function (resolve) {
        var grabberMessage = {"action": "grabContentBySelector", "message": selector.toString()};
        chrome.tabs.sendMessage(lastActiveTabId, grabberMessage, function returnFromContentGrabber(content) {
          Logger.info("[form_util.js] Received content from 'grabber': '" + content + "'");
          resolve(content);
        });
      });
    };
  },
  wrapInPromise: function wrapInPromise(func, context) {
    // Utility function to wrap a function in
    // a promise
    return new Promise(function promise(resolve) {
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
  },
  applyRule: function applyRule(rule, lastActiveTab) {
    this.lastRule = rule;
    var message = null;
    var beforeData;
    var errors = [];

    // Whatever the reason. Sometimes the rule is undefined when this is called
    if(typeof rule === "undefined") {
      Logger.info("[form_util.js] this.lastRule is undefined. Canceling application of rule.");
      return;
    }

    // Open long standing connection to the tab containing the form to be worked on
    if(typeof lastActiveTab === "undefined") {
      Logger.info("[form_util.js] lastActivetab has gone away. Exiting.");
      return;
    }
    var port = chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});

    // Now we can display the WORKING throbber!
    port.postMessage({"action": "showOverlay"});

    // The context is passed as the second argument to the before function.
    // It represents to environment in which the rule is executed.
    // It also contains the grabber which can find content inside the current webpage
    var context = {
      url: Utils.parseUrl(lastActiveTab.url),
      findHtml: FormUtil._grabber(lastActiveTab.id)
    };

    // Default instantaneous resolving promise:
    var beforeFunctions = [function beforeFuncPromise() {
      return new Promise(function promise(resolve) {
        resolve(null);
      });
    }];

    Logger.info("[form_utils.js] Applying rule " + JSONF.stringify(this.lastRule.name) + " (" + JSONF.stringify(this.lastRule.fields) + ") to tab " + lastActiveTab.id);

    // Is there a 'before' block with an function or an array of functions?
    if(typeof rule.before === "function") {
      // A single before function
      beforeFunctions = [ FormUtil.wrapInPromise(rule.before, context) ];
    } else if(typeof rule.before === "object" && typeof rule.before.length !== "undefined") {
      // Assume an array of functions
      beforeFunctions = rule.before.map(function beforeFuncMap(func) {
        return FormUtil.wrapInPromise(func, context);
      });
    }

    Logger.info("[form_util.js] set 'before' function to " + JSONF.stringify(rule.before));

    // call either the default - instantaneously resolving Promise (default) or
    // the arrray of before functions defined in the rule.
    Promise.all(beforeFunctions).then(function beforeFunctionsPromise(data) {
      beforeData = data;

      // If the first beforeData is a function and executes to null then
      // the rules and workflows that are running should be *canceled*
      if(typeof beforeData[0] === "function" && beforeData[0]() === null) {
        // Cancel workflows
        Storage.delete(Utils.keys.runningWorkflow);

        // The halting message is shown via Libs.halt("the message");
        // So nothing to do here
        // return null to stop precessing
        return null;
      }

      // beforeData is null when there is no before function defined in the rule definition
      if(beforeData !== null) {
        Logger.info("[form_util.js] Got before data: " + JSONF.stringify(beforeData));

        // Lets see if we got any errors thrown inside the executed before function
        var filteredErrors = beforeData.filter(function filteredErrors(beforeFunctionData) {
          return beforeFunctionData && beforeFunctionData.hasOwnProperty("error");
        });

        if (filteredErrors.length > 0) {
          // Produce error objects compatible to those used for form filling errors
          errors = filteredErrors.map(function filteredErrorsMap(errorObj) {
            return { selector: "Inside before function", value: errorObj.error.beforeFunction, message: errorObj.error.message };
          });

          Notification.create("An error occured while executing a before function. Click here to view it.", null, function notificationCreate() {
            FormUtil.saveErrors(errors, rule);
          });
        }
      }

      // If there was only one rule
      // reduce data array to one element
      if(beforeData.length === 1) {
        beforeData = beforeData[0];
      }

      // Detect vendored libraries
      var usedLibs = FormUtil.detectLibraries(JSONF.stringify(rule.fields));

      // Resolve all promises
      Promise.all(FormUtil.generateLibsPromises(usedLibs)).then(function prUsedLibsAll() {
        // Check for rules to import (shared rules)
        FormUtil.resolveImports(rule).then(function resolveImports(aRule) {
          FormUtil.sendFieldsToContent(aRule, beforeData, port);

          // Get errors. Receiver is in content.js
          Logger.info("[form_util.js] Posted to content.js: 'getErrors'");
          port.postMessage({"action": "getErrors"});
        });
      });

    }).then(null, function error(msg) {
      //console.error(msg);
    });

    port.onMessage.addListener(function portOnMessageListener(msg) {
      // Make errors from content scripts available here
      if(msg.action === "getErrors") {
        var sentErrors = JSONF.parse(msg.errors);
        FormUtil.reportErrors(sentErrors, rule, port);
      }
    });
  }
};
