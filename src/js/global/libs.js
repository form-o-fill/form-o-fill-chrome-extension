import state from "./state";
import Utils from "./utils";
import Logger from "../debug/logger";

var setThrobberText = function(text) {
  // Change the text of the throbber
  if(state.getLastActiveTab() === null) {
    return null;
  }

  // Since this is called from the background pages
  // we need to send a message to the content.js
  chrome.tabs.sendMessage(state.getLastActiveTabId(), {action: "showOverlay", message: text});
};

// This is a function "dummy"
// It represents code to copy the content of one
// DOM node to another.
// The SELECTOR will be replaced and re-compiled later.
// see Libs.h.copyValue
var _copyValueFunction = function() {
  if(!Utils.isBgPage()) {
    var $source = document.querySelector("##SELECTOR##");
    if($source === null) {
      // element not found
      setThrobberText(chrome.i18n.getMessage("lib_h_copyvalue_field_not_found", [ "##SELECTOR##" ]));
      return null;
    }

    // element found
    return $source.value;
  }
  return null;
};

// Helper for use in value functions
//
// "value" : Libs.h.click  => Clicks on the element specified by 'selector'
//           Libs.h.screenshot("save_as_filename") => Save a screenshot of visible area as [filename]
//           Libs.h.copyValue("#selector") => copies the *value* ofthe chosen field
//           Libs.h.displayMessage("Some text") => shows a message to the user
var valueFunctionHelper = {
  click: function($domNode) {
    $domNode.click();
  },
  screenshot: function(saveAs) {
    chrome.runtime.sendMessage({action: "takeScreenshot", value: state.getCurrentRuleMetadata(), flag: saveAs});
  },
  copyValue: function(selector) {
    selector = selector.replace(/"/g, "");
    // This needs explaining:
    // Since FoF looks for a function to execute (the typical value function) and Libs.h.copyValue("selector") must return one
    // we need to dynamically create a function here since the 'selector' parameter gets lost while serializing.
    // This creates a new function where SELECTOR is replaced by that variable so there is no parameter at all.
    //
    // return new Function(_copyValueFunction <-- Take the body of the dummy function
    // .toString()                            <-- As a string
    // .replace(/##SELECTOR##/g, selector)    <-- Replace the selector placeholder with it's real value
    // .replace(/^.*?\n/,"")                  <-- Strip the anonymous function declaration in the first line
    // .replace(/}$/,""));                    <-- Strip the last closing bracket
    /*eslint-disable no-new-func*/
    return new Function(_copyValueFunction.toString().replace(/##SELECTOR##/g, selector).replace(/^.*?\n/,"").replace(/}$/,""));
    /*eslint-enable no-new-func*/
  },
  displayMessage: setThrobberText
};

// Process control functions
var processFunctionsHalt = function(msg) {
  return function() {
    if(typeof state.getLastActiveTab() === "undefined") {
      return null;
    }

    if(typeof msg === "undefined") {
      msg = chrome.i18n.getMessage("lib_halt_canceled");
    }

    setThrobberText(msg);
    return null;
  };
};

/*eslint no-loop-func:0 */
var Libs = {
  add: function(libraryName, librayTopLevelFunction, forceAdd) {
    // Check if the method is already defined
    forceAdd = forceAdd || false;
    if(this.hasOwnProperty(libraryName) && !forceAdd) {
      Logger.info("[libs.js] Did not add '" + libraryName + "' to Libs, because it already exists as a function().");
      return;
    }
    this[libraryName] = librayTopLevelFunction;
    Logger.info("[libs.js] Added library as Libs." + libraryName);
  },
  importFromRules: function(prListOfRuleInstances) {
    return new Promise(function (resolve) {
      prListOfRuleInstances.then(function (rules) {
        rules.forEach(function (rule) {
          if (typeof rule.export !== "undefined" && typeof rule.lib === "function") {
            // Add the rule into the scope of all library functions
            Libs.add(rule.export, rule.lib, true);
          }
        });
        Logger.info("[libs.js] Current libraries : " + Object.keys(Libs).toString());
        resolve(true);
      });
    });
  },
  // Dectects libraries used in a rulecode string
  // returns an array of found libraries
  detectVendoredLibraries: function(ruleCodeString) {
    var detectedLibs = [];
    Object.keys(Utils.vendoredLibs).forEach(function dtctLib(vLibKey) {
      if(ruleCodeString.match(Utils.vendoredLibs[vLibKey].detectWith) !== null) {
        // Found!
        detectedLibs.push(vLibKey);
      }
    });
    return detectedLibs;
  },
  loadLibs: function(scriptPaths, whoCallsMe) {
    /*eslint-disable complexity */
    return new Promise(function (resolve) {
      if(typeof scriptPaths === "string") {
        scriptPaths = [scriptPaths];
      }

      // If there is no script to inject
      // OR we run in the context of the content page
      // resolve now.
      // The content page gets its libraries by using the chrome API (see background/form_util.js#injectAndAttachToLibs)
      if(scriptPaths.length === 0 || !Utils.isBgPage()) {
        resolve(0);
        return;
      }

      var anchor = document.querySelector("body");
      var fragment = document.createDocumentFragment();

      var loadedScriptCount = 0;
      var targetScriptCount = scriptPaths.length;
      var scriptPath;

      for(var i = 0; i < targetScriptCount; i++) {
        scriptPath = scriptPaths[i];

        var vLib = Utils.vendoredLibs[scriptPath];
        var libName = vLib.name;

        // If a lib with that name is already present, don't load it again
        if(typeof Libs[libName] !== "undefined") {
          loadedScriptCount++;
          Logger.info("[libs.js] Didn't load '" + scriptPath + "' again");
          continue;
        }

        // If the requested lbrary is not vendored, break loop
        if(typeof vLib === "undefined") {
          Logger.info("[libs.js] Didn't load '" + scriptPath + "' since it is not vendored (see utils.js)");
          loadedScriptCount++;
          continue;
        }

        // If the library is present on window (somehow) just add it to Libs (again)
        if(typeof window[vLib.onWindowName] !== "undefined" && typeof Libs[libName] === "undefined") {
          Libs.add(libName, window[vLib.onWindowName]);
          loadedScriptCount++;
          continue;
        }

        var script = document.createElement("script");
        script.async = false;
        script.dataset.who = whoCallsMe;
        script.className = "injectedByFormOFill";
        script.dataset.script = scriptPath;
        script.src = chrome.extension.getURL(scriptPath);
        script.onload = function() {
          // Add Library to Libs
          Libs.add(libName, window[vLib.onWindowName]);
          loadedScriptCount++;
          Logger.info("[libs.js] Loaded '" + scriptPath + "'");

          // If all script are loaded, resolve promise
          if (loadedScriptCount >= targetScriptCount) {
            resolve(loadedScriptCount);
          }
        };
        script.onerror = function() {
          resolve(loadedScriptCount);
        };

        // Since this is all async make sure nobody has already
        // inserted it while we worked on this script:
        if(document.querySelectorAll("script[data-script='" + scriptPath + "']").length === 0) {
          fragment.appendChild(script);
        }
      }

      // If the loop is ready and the count already matches,
      // there was nothing to to and that's ok
      if (loadedScriptCount >= targetScriptCount) {
        resolve(loadedScriptCount);
      }

      // Only insert the fragment if it has something inside
      if(fragment.childNodes.length > 0) {
        anchor.appendChild(fragment);
      }
    });
    /*eslint-enable complexity */
  }
};

Libs.add("h", valueFunctionHelper);
Libs.add("halt", processFunctionsHalt);

module.exports = Libs;
