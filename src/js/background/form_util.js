/* global Utils, Logger, JSONF, Notification, Storage, Rules, lastActiveTab, Libs */
var FormUtil = {
  lastRule: null,
  functionToHtml: function functionToHtml(func) {
    return func.toString().replace(/ /g, "&nbsp;").split("\n").join("<br />");
  },
  _findImport: function _findImport(ruleName) {
    return new Promise(function findImportPromise(resolve) {
      Rules.all().then(function findImportThen(rules) {
        var ruleToImport = rules.filter(function findImportFilter(aRule) {
          return aRule.name === ruleName;
        })[0];
        resolve({
          ruleToImport: ruleToImport || null,
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
        return FormUtil._findImport(fieldDef.import);
      });

      // resolve found shared rules
      Promise.all(importableRulesPromises).then(function importableRulesPromises2(arrayOfRules) {
        var lookup = {};
        if(arrayOfRules.length > 0) {
          Logger.info("[b/form_util.js] Found importable rules:", arrayOfRules);
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
  displayMessage: function displayMsg(msg) {
    this.getPort().postMessage({action: "showMessage", message: msg});
  },
  sendLibsReloadToContent: function(port) {
    port.postMessage({"action": "reloadLibs"});
  },
  buildFlags: function(ruleDef, fieldDef) {
    // onlyEmpty:  If true only fills the field if the target is currently "empty"
    //             Can be set on rules or field defs. Latter overwrites first.
    // screenshot: Takes a screenshot if truthy. If string saves it under that name.
    var onlyEmpty;
    onlyEmpty = typeof ruleDef.onlyEmpty === "boolean" ? ruleDef.onlyEmpty : false;
    onlyEmpty = typeof fieldDef.onlyEmpty === "boolean" ? fieldDef.onlyEmpty : onlyEmpty;

    var screenshot;
    screenshot = typeof fieldDef.screenshot !== "undefined" ? fieldDef.screenshot : false;

    return {
      onlyEmpty: onlyEmpty,
      screenshot: screenshot
    };
  },
  sendFieldsToContent: function(aRule, beforeData, port) {
    // Now send all field definitions to the content script
    var message;
    var screenshotFlagFromRule = aRule.screenshot === true ? true : false;

    aRule.fields.forEach(function ruleFieldsForEach(field, fieldIndex) {
      // If the rule has screenshot : true and this is the last executing field definition
      // take a screenshot via the fields screenshot flag
      if(screenshotFlagFromRule && fieldIndex === aRule.fields.length - 1) {
        Logger.info("[b/form_util.js] Flagging field #" + fieldIndex + " with screenshot = true (rule: " + aRule.nameClean + ")");
        field.screenshot = true;
      }

      // The message contains ...
      //
      // action: "fillField"
      // selector: the query selector to use
      // value: The value to fill the field with (or a value function to execute)
      // flags: boolean flags to honor (like onlyEmpty)
      // beforeData: The resolved before data
      // meta: meta data about the source of the data
      message = {
        "action": "fillField",
        "selector": field.selector,
        "value": JSONF.stringify(field.value),
        "flags": FormUtil.buildFlags(aRule, field),
        "beforeData": beforeData,
        "meta": {
          "ruleId": aRule.id,
          "name": aRule.nameClean,
          "fieldIndex": fieldIndex,
          "lastField": fieldIndex === aRule.fields.length - 1 ? true : false
        }
      };
      port.postMessage(message);
      Logger.info("[b/form_util.js] Posted to content.js: Fill " + field.selector + " with " + field.value);
    });
  },
  reportErrors: function(theErrors, rule, port) {
    Logger.warn("[b/form_util.js] Received 'getErrors' with " + theErrors.length + " errors");
    if(theErrors.length > 0) {
      Notification.create(chrome.i18n.getMessage("bg_error_while_filling", [theErrors.length]), null, function notificationCreated() {
        FormUtil.saveErrors(theErrors, rule);
      });
    }
    port.postMessage({"action": "hideWorkingOverlay"});
  },
  injectAndAttachToLibs: function(pathToScript, nameOnLib, nameOnWindow) {
    return new Promise(function (resolve) {
      // First inject the library itself (eg. moment.js)
      chrome.tabs.executeScript(null, {file: pathToScript}, function () {
        // When the library is injected, bind it to "Libs"
        chrome.tabs.executeScript({code: "Libs.add('" + nameOnLib + "', window." + nameOnWindow + ");"}, function () {
          Logger.info("[b/form_util.js] Libs.add('" + nameOnLib + "', window." + nameOnWindow + ");");
          resolve(pathToScript);
        });
      });
    });
  },
  generateLibsPromisesForContentPage: function(rule) {
    // Detect vendored libraries
    var libs = Libs.detectVendoredLibraries(JSONF.stringify(rule.fields));

    // Inject the libs into the page
    // Build an array starting with an instant resolving promise
    var prUsedLibs = [ Promise.resolve() ];

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
  createGrabber: function(lastActiveTabId) {
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
        Logger.warn("[b/form_util.js] Got an exception executing before function: " + func);
        Logger.warn("[b/form_util.js] Original exception: " + e);
        Logger.warn("[b/form_util.js] Original stack: " + e.stack);

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
  storage: {
    // Why use localStorage here instead of chrome.storage?
    // localStorage is synchronous and this is way easier to use than
    // callbacks or promises
    base: window.sessionStorage.getItem(Utils.keys.sessionStorage) || {},
    get: function(key) {
      if(typeof this.base[key] === "undefined") {
        return this.base[key];
      }
      return JSONF.parse(this.base[key]);
    },
    set: function(key, value) {
      this.base[key] = JSONF.stringify(value);
      // Also set the variable in content.js
      chrome.tabs.sendMessage(lastActiveTab.id, {action: "storageSet", key: key, value: this.base[key]});
      // Save in background.js
      window.sessionStorage.setItem(Utils.keys.sessionStorage, this.base);
      return window.sessionStorage;
    },
    delete: function() {
      window.sessionStorage.setItem(Utils.keys.sessionStorage, "{}");
    }
  },
  generateFunctionsPromises: function(beforeOrAfter, rule, context) {
    // Default instantaneous resolving promise:
    var prepFunctions = [function beforeFuncPromise() {
      return new Promise(function promise(resolve) {
        resolve(null);
      });
    }];

    // Is there a 'before' or 'after' block with an function or an array of functions?
    if(typeof rule[beforeOrAfter] === "function") {
      // A single before function
      prepFunctions = [ FormUtil.wrapInPromise(rule[beforeOrAfter], context) ];
    } else if(typeof rule[beforeOrAfter] === "object" && typeof rule[beforeOrAfter].length !== "undefined") {
      // Assume an array of functions
      prepFunctions = rule[beforeOrAfter].map(function beforeFuncMap(func) {
        return FormUtil.wrapInPromise(func, context);
      });
    }

    Logger.info("[form_util.js] set '" + beforeOrAfter + "' function to " + JSONF.stringify(rule[beforeOrAfter]));

    return prepFunctions;
  },
  createContext: function() {
    // The context is passed as the second argument to the before function.
    // It represents to environment in which the rule is executed.
    // It also contains the grabber which can find content inside the current webpage
    // and the storage object
    return {
      url: Utils.parseUrl(lastActiveTab.url),
      findHtml: FormUtil.createGrabber(lastActiveTab.id),
      storage: FormUtil.storage
    };
  },
  generateSetupContentPromise: function(setupContentFunc, port) {
    // This returns a promise that resolves when the
    // content.js has executed the setupContent function
    return new Promise(function (resolve) {
      Logger.info("[form_util.js] Adding setupContent promise to stack");
      port.postMessage({ "action": "setupContent", "value": JSONF.stringify(setupContentFunc) });
      port.onMessage.addListener(function(message) {
        // The content.js will post a complete message when the setupContent function has been
        // executed
        if(message.action === "setupContentDone") {
          resolve();
        }
      });
    });
  },
  handleApplyErrors: function(errors, rule) {
    // Produce error objects compatible to those used for form filling errors
    errors = errors.map(function filteredErrorsMap(errorObj) {
      return { selector: "Inside before function", value: errorObj.error.beforeFunction, message: errorObj.error.message };
    });

    Notification.create(chrome.i18n.getMessage("bg_error_in_before"), null, function notificationCreate() {
      FormUtil.saveErrors(errors, rule);
    });
  },
  resolveImportsAndPostToContent: function(rule, beforeData, port) {
    // Check for rules to import (shared rules)
    FormUtil.resolveImports(rule).then(function resolveImports(aRule) {
      // Fill that rule
      // TODO: use a promise here and only getErrors when resolved (FS, 2015-10-07)
      FormUtil.sendFieldsToContent(aRule, beforeData, port);

      // Get errors. Receiver is in content.js
      Logger.info("[b/form_util.js] Posted to content.js: 'getErrors'");
      port.postMessage({"action": "getErrors"});
    });
  },
  processBeforeData: function(rule, beforeData) {
    // beforeData is null when there is no before function defined in the rule definition
    if(beforeData !== null) {
      Logger.info("[form_util.js] Got before data: " + JSONF.stringify(beforeData));

      // Lets see if we got any errors thrown inside the executed before function
      var filteredErrors = beforeData.filter(function filteredErrors(beforeFunctionData) {
        return beforeFunctionData && beforeFunctionData.hasOwnProperty("error");
      });

      if (filteredErrors.length > 0) {
        FormUtil.handleApplyErrors(filteredErrors, rule);
      }
    }

    // If there was only one rule
    // reduce data array to one element
    if(beforeData.length === 1) {
      beforeData = beforeData[0];
    }

    return beforeData;
  },
  getPort: function() {
    return chrome.tabs.connect(lastActiveTab.id, {name: "FormOFill"});
  },
  applyRule: function applyRule(rule, lastActiveTab) {
    this.lastRule = rule;

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
    var port = this.getPort();

    // Now we can display the WORKING throbber!
    port.postMessage({"action": "showOverlay"});

    // reload LIBS just in case
    FormUtil.sendLibsReloadToContent(port);

    // Detect vendored libraries in before functions and import them into Libs
    Libs.detectVendoredLibraries(JSONF.stringify(rule.before)).forEach(function (libPath) {
      Logger.info("[b/form_util.js] Assigning " + libPath + " as it is used in the before function");
      Libs.add(Utils.vendoredLibs[libPath].name, window[Utils.vendoredLibs[libPath].onWindowName]);
    });

    Logger.info("[form_utils.js] Applying rule " + JSONF.stringify(this.lastRule.name) + " (" + JSONF.stringify(this.lastRule.fields) + ") to tab " + lastActiveTab.id);

    // First import all neccessary defined libs
    Libs.import().then(function() {
      // Promises for before functions:
      var beforePromises = FormUtil.generateFunctionsPromises("before", rule, FormUtil.createContext());

      // Resolve all promises
      // call either the instantaneously resolving Promise (default) or
      // the array of before functions defined in the rule.
      // TODO: move to sep functions (FS, 2015-10-07)
      Promise.all(beforePromises).then(function beforeFunctionsPromise(beforeData) {
        // If the first beforeData is a function and executes to null thebn
        // the rules and workflows that are running should be *canceled*
        if(typeof beforeData[0] === "function" && beforeData[0]() === null) {
          // Cancel workflows
          Storage.delete(Utils.keys.runningWorkflow);

          // The halting message is shown via Libs.halt("the message");
          // So nothing to do here
          // return null to stop precessing
          return null;
        }

        // Handle before data errors
        beforeData = FormUtil.processBeforeData(rule, beforeData);

        // generate promises for importing those libraries into the content page context
        var contentLibImportAndSetupContentPrs = FormUtil.generateLibsPromisesForContentPage(rule);

        // setupContent function defined? Add those to the promises
        if(typeof rule.setupContent === "function") {
          contentLibImportAndSetupContentPrs.push(FormUtil.generateSetupContentPromise(rule.setupContent, port));
        }

        // Resolve all promises
        // lib import for content page context + setupContent
        Promise.all(contentLibImportAndSetupContentPrs).then(function() {
          FormUtil.resolveImportsAndPostToContent(rule, beforeData, port);
        });

      }).catch(function error(msg) {
        console.error(msg);
      });
    });

    port.onMessage.addListener(function portOnMessageListener(msg) {
      // Make errors from content scripts available here
      if(msg.action === "getErrors") {
        var sentErrors = JSONF.parse(msg.errors);
        FormUtil.reportErrors(sentErrors, rule, port);
      }
    });
  },
  listenForContentMessages: function() {
    // Listen for messages from content.js
    chrome.runtime.onMessage.addListener(this.handleContentMessages);
  },
  handleContentMessages: function(message) {
    // Message that the form filling is done
    if(message.action === "fillFieldFinished" && typeof FormUtil.lastRule !== "undefined") {
      var rule = FormUtil.lastRule;

      // If the rule has a teardownContent functions execute it
      // This is sent to content.js and runs in the context of the content page
      if(typeof rule.teardownContent === "function") {
        FormUtil.getPort().postMessage({ action: "teardownContent", value: JSONF.stringify(rule.teardownContent)});
      }

      // If the rule has a "after" function, execute it
      // It has access to the same context object used in the before function
      // The signature is the same as with before functions
      if(typeof rule.after === "function") {
        Promise.all(FormUtil.generateFunctionsPromises("after", rule, FormUtil.createContext())).then(function() {
          Logger.info("[b/form_util.js] Executed after function: " + JSONF.stringify(rule.after));
        });
      }
    }
  }
};
