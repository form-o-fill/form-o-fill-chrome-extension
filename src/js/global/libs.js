import Logger from "../debug/logger";
import Utils from "./utils";
import Rules from "./rules";
import FormFiller from "../content/form_filler";

// This creates a "safe" namespace for all libs
var Libs = {
  _libs: {},
  add: function(libraryName, librayTopLevelFunction, forceAdd) {
    // Check if the method is already defined
    forceAdd = forceAdd || false;
    if((this._libs[libraryName] || this.hasOwnProperty(libraryName)) && !forceAdd) {
      Logger.info("[libs.js] Can not add library named '" + libraryName + "' because it already exists as a function().");
      return;
    }
    this[libraryName] = librayTopLevelFunction;
    Logger.info("[libs.js] Added library as Libs." + libraryName);
  },
  import: function() {
    return new Promise(function (resolve) {
      Rules.all().then(function (rules) {
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
  detectLibraries: function(ruleCodeString) {
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
      // resolve now
      // The content page gets its libraries by using the chrome API (see background/form_util.js#injectAndAttachToLibs)
      if(scriptPaths.length === 0 || typeof chrome.extension === "undefined" ||  typeof chrome.extension.getBackgroundPage === "undefined") {
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

        // If the requested lbrary is not vendored, break loop
        if(typeof Utils.vendoredLibs[scriptPath] === "undefined") {
          continue;
        }

        var libName = Utils.vendoredLibs[scriptPath].name;

        // If a lib with that name is already present, don't load it again
        if(typeof Libs[libName] !== "undefined") {
          loadedScriptCount++;
          Logger.info("[libs.js] Didn't load '" + scriptPath + "' again");
          continue;
        }

        var script = document.createElement("script");
        script.async = false;
        script.dataset.who = whoCallsMe;
        script.className = "injectedByFormOFill";
        script.dataset.script = scriptPath;
        script.src = chrome.extension.getURL(scriptPath);
        /*eslint-disable no-loop-func*/
        script.onload = function() {
          // Add Library to Libs
          Libs.add(libName, window[Utils.vendoredLibs[scriptPath].onWindowName]);
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
        /*eslint-enebale no-loop-func*/

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

// helper for use in value functions
//
// "value" : Libs.h.click  => Clicks on the element specified by 'selector'
var valueFunctionHelper = {
  click: function($domNode) {
    $domNode.click();
  },
  screenshot: function(saveAs) {
    chrome.runtime.sendMessage({action: "takeScreenshot", value: FormFiller.currentRuleMetadata, flag: saveAs});
  }
};
Libs.add("h", valueFunctionHelper);

// Change the text of the throbber
var setThrobberText = function(text) {
  // Since this is called from the background pages
  // we need to send a message to the content.js
  chrome.tabs.sendMessage(window.lastActiveTab.id, {action: "showOverlay", message: text});
};
Libs.add("displayMessage", setThrobberText);

// Process control functions
// Run in the context of the background page
// thus lastActiveTab is available
var processFunctionsHalt = function(msg) {
  return function() {
    if(typeof window.lastActiveTab === "undefined") {
      return null;
    }

    if(typeof msg === "undefined") {
      msg = "Canceled by call to Libs.halt()";
    }

    setThrobberText(msg);
    return null;
  };
};
Libs.add("halt", processFunctionsHalt);

module.exports = Libs;
