/*global jQuery introJs window editor Rules loadRules updateTabStats */
var tutorials = tutorials || [];

(function tutorialScope(jQuery) {
  "use strict";

  var tutorialRunning = false;

  var Tutorial = function(tourNumber) {
    this.tourNumber = tourNumber;
    this.steps = this.loadSteps(tourNumber);
    this.intro = this.initIntroJs();
  };

  // Cancel all tutorials
  var cancelAllTutorials = function() {
    tutorials.forEach(function (tutorial) {
      if(typeof tutorial.observer !== "undefined") {
        tutorial.observer.disconnect();
        tutorial.intro.exit();
      }
    });
    Tutorial.endTutorialMode();
    tutorials = [];
    tutorialRunning = false;
    editor.removeAllMarkers();
  };

  Tutorial.tour = {};

  Tutorial.prototype.loadSteps = function(tourNumber) {
    var steps = [];
    jQuery(".tut-tour-" + tourNumber + " .step").each(function (index) {
      var data = this.dataset;

      var step = {
        intro: this.innerHTML,
        element: data.element,
        position: data.position || "bottom-left-aligned",
        trigger: data.trigger,
        buttons: (data.buttons === "false" ? false : true),
        overlay: (data.overlay === "false" ? false : true),
        index: index,
        width: data.width,
        elementChanged: false,
        markLine: data.markLine,
        importRules: data.importRules
      };

      steps.push(step);
    });

    return steps;
  };

  Tutorial.prototype.onBeforeChangeHandler = function(tutorial) {
    /*eslint-disable complexity */
    return function() {
      /*eslint-disable no-underscore-dangle */
      var stepIndex = tutorial.intro._currentStep;
      var step = tutorial.intro._introItems[stepIndex];
      /*eslint-enable no-underscore-dangle */

      step.tooltipClass = "step-" + stepIndex;
      step.position = tutorial.steps[stepIndex].position || "bottom";

      if(typeof step.importRules !== "undefined") {
        var importDump = document.querySelector(step.importRules).textContent;
        Rules.importAll(importDump).then(function() {
          loadRules(1);
          updateTabStats();
          editor.redraw();
        });
      }

      if(!step.buttons) {
        jQuery(".introjs-tooltipbuttons").hide();
        jQuery(".introjs-tooltipReferenceLayer").hide();
      } else {
        jQuery(".introjs-tooltipbuttons").show();
        jQuery(".introjs-tooltipReferenceLayer").show();
      }

      if(!step.overlay) {
        jQuery(".introjs-overlay").hide();
      } else {
        jQuery(".introjs-overlay").show();
      }


    };
    /*eslint-enable complexity */
  };

  Tutorial.prototype.executeJavascriptStep = function(step) {
    if(typeof Tutorial.tour[this.tourNumber] !== "undefined" && typeof Tutorial.tour[this.tourNumber][step.index + 1] === "function") {
      var target = Tutorial.tour[this.tourNumber][step.index + 1](step);
      if(target) {
        step.element = target;
        step.elementChanged = true;
      }
    }
  };

  Tutorial.prototype.handleMarkLine = function(step) {
    var marks = step.markLine.toString().split(",");
    if(typeof marks[1] == "undefined") {
      marks[1] = marks[0];
    }
    if(marks[0] === "0") {
      editor.removeAllMarkers();
    } else {
      editor.setMarker(parseInt(marks[0], 10), parseInt(marks[1], 10));
      step.element = document.querySelector(".ace_text-layer .ace_line:nth-child(" + marks[0] + ")");
      step.elementChanged = true;
    }
  };

  Tutorial.prototype.handleElementChanged = function($helper, step) {
    $helper.css("background-color", "transparent");
    jQuery(".introjs-fixParent").removeClass("introjs-fixParent");

    var ePos = jQuery(step.element).offset();
    jQuery(".introjs-tooltipReferenceLayer").css("top", ePos.top + "px");//.css("left", ePos.left + "px");
  };

  Tutorial.prototype.onAfterChangeHandler = function(tutorial) {
    /*eslint-disable complexity*/
    return function() {
      jQuery(".introjs-tooltip").attr("data-width", "");

      /*eslint-disable no-underscore-dangle */
      var stepIndex = tutorial.intro._currentStep;
      var step = tutorial.intro._introItems[stepIndex];
      /*eslint-enable no-underscore-dangle */

      // Javascript step function defined?
      // returns the element to be marked
      tutorial.executeJavascriptStep(step);

      var $helper = jQuery(".introjs-helperLayer");

      if(typeof step.markLine !== "undefined") {
        tutorial.handleMarkLine(step);
      }

      if(step.elementChanged) {
        tutorial.handleElementChanged($helper, step);
      }

      if(!step.overlay) {
        $helper.hide();
        jQuery(".introjs-overlay").addClass("hidden").hide();
      } else {
        $helper.show();
        jQuery(".introjs-overlay").removeCLass("hidden").show();
      }

      // Last step? No "next step" link
      if(tutorial.intro._introItems.length - 1 === stepIndex) {
        jQuery(".introjs-nextbutton").hide();
      }

      if(typeof step.width !== "undefined") {
        jQuery(".introjs-tooltip").attr("data-width", step.width);
      }
    };
    /*eslint-enable complexity*/
  };

  Tutorial.prototype.onCompleteHandler = function() {
    // remove marker
    cancelAllTutorials();

    // Restore saved rules/workflows
    Tutorial.endTutorialMode();
  };

  Tutorial.prototype.initIntroJs = function() {
    var intro = introJs();

    intro.setOptions({
      steps: this.steps,
      nextLabel: "Next Step",
      skipLabel: "Cancel Tour",
      showBullets: false,
      showStepNumbers: false,
      keyboardNavigation: false,
      exitOnEsc: false,
      exitOnOverlayClick: false
    });

    intro.onbeforechange(this.onBeforeChangeHandler(this));
    intro.onafterchange(this.onAfterChangeHandler(this));
    intro.oncomplete(this.onCompleteHandler);
    intro.onexit(this.onCompleteHandler);

    return intro;
  };

  Tutorial.prototype.execute = function(tutorial) {
    tutorial.intro.start();
    tutorialRunning = true;
    tutorial.observeDomChanges();
  };

  Tutorial.prototype.start = function() {
    var tutorial = this;

    // Bind on button
    var selector = "a.tut-start-tour-" + tutorial.tourNumber;
    jQuery(selector).on("click", function() {
      tutorial.execute(tutorial);
    });
  };

  // This extracts all classnames from added or removed DOM nodes
  Tutorial.prototype.mutatedClassNames = function(nodeList) {
    var mutClasses = [];
    var aNodes = [].slice.call(nodeList);

    if(aNodes.length > 0) {
      var classNames = aNodes.map(function (node) {
        return node.className;
      });
      classNames = classNames.filter(function (className) {
        return className !== "";
      });
      mutClasses = mutClasses.concat(classNames);
    }
    return mutClasses;
  };

  // This returns n array of text changed by the added DOM nodes
  Tutorial.prototype.mutatedTexts = function(nodeList) {
    var mutTexts = [];

    for(var i = 0; i < nodeList.length; i++) {
      if(nodeList[i].textContent) {
        mutTexts.push(nodeList[i].textContent);
      }
    }
    return mutTexts;
  };

  Tutorial.prototype.domObserver = function(tutorial) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    return new MutationObserver(function(mutations) {
      var added = [];
      var removed = [];
      var attrs = [];
      var contentAdded = [];

      mutations.forEach(function (mutation) {
        added = added.concat(tutorial.mutatedClassNames(mutation.addedNodes));
        contentAdded = contentAdded.concat(tutorial.mutatedTexts(mutation.addedNodes));
        removed = removed.concat(tutorial.mutatedClassNames(mutation.removedNodes));
        if(typeof mutation.target.style !== "undefined") {
          attrs = attrs.concat(mutation.target.style.cssText);
        }
      });

      /*eslint-disable complexity */
      tutorial.steps.every(function (step) {
        if(typeof step.trigger !== "undefined") {
          var typeToCheck = step.trigger[0];
          var triggerCls = step.trigger.substr(1);

          // + : element with class is visible
          if(added.indexOf(triggerCls) !== -1 && typeToCheck === "+") {
            // Trigger Step
            tutorial.intro.goToStep(step.index + 1);
            return false;
          }

          // - : element with class is invisible
          if(removed.indexOf(triggerCls) !== -1 && typeToCheck === "-") {
            // Trigger Step
            tutorial.intro.goToStep(step.index + 1);
            return false;
          }

          // elements style attributes change
          if(typeToCheck === "/") {
            var styleToCheckMatch = triggerCls.match(/^(.*?)\[(.*?)\]/);
            var found = attrs.filter(function (attr) {
              return attr.indexOf(styleToCheckMatch[2]) > -1;
            });

            if(found.length > 0) {
              tutorial.intro.goToStep(step.index + 1);
              return false;
            }
          }

          // triggers when text gets visible SOMEWHERE ON THE PAGE
          if(typeToCheck === "?" && contentAdded.indexOf(triggerCls) > -1) {
            tutorial.intro.goToStep(step.index + 1);
            return false;
          }
        }
        /*eslint-enable complexity*/

        return true;
      });
    });
  };

  Tutorial.prototype.observeDomChanges = function() {
    var tutorial = this;
    this.observer = this.domObserver(this);

    // Observe:
    // 1. All notices displayed
    // 2. The info span that displays messages if the user clicks a menu button
    var observeDomElements = [ "#notices", ".editor .menu span" ].map(function(selector) {
      return document.querySelector(selector);
    });

    observeDomElements.forEach(function (observeDomElement) {
      tutorial.observer.observe(observeDomElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ["style"]
      });
    });
  };

  // restore backup data stored before the tutorials started
  Tutorial.endTutorialMode = function() {
    chrome.runtime.sendMessage({action: "resetTutorialState"}, function() {
      window.location.reload();
    });
  };

  Tutorial.startOnOpen = function() {
    chrome.runtime.sendMessage({action: "getTutorialOnOpenOptions"}, function (tutorialNumber) {
      tutorialNumber = parseInt(tutorialNumber, 10);
      // REMOVE START
      // For debugging:
      if(typeof window.debugTutorial !== "undefined") {
        tutorialNumber = window.debugTutorial;
      }
      // REMOVE END
      if(tutorialNumber > 0) {
        var tutorial = tutorials.filter(function(theTutorial) {
          return parseInt(theTutorial.tourNumber, 10) === tutorialNumber;
        });

        if(tutorial.length === 1) {
          // Start the tutorial
          tutorial[0].execute(tutorial[0]);
          tutorialNumber = 0;
        }
      }
    });
  };

  window.Tutorial = Tutorial;

  // If the user clicks on a menu item, cancel all tutorials
  jQuery(".menu").on("click", "a", function () {
    if(this.classList.contains("no-click") || !tutorialRunning) {
      return true;
    }

    // tell bg.js to reset the active tutorial number
    chrome.runtime.sendMessage({action: "activateTutorialOnOpenOptions", message: 0});

    cancelAllTutorials();
  });

})(jQuery);

// If the tutorial tours are loaded, initialize the tutorial
jQuery(document).on("i18n-loaded", function (event, pageName) {
  if(pageName.indexOf("tutorial/_tour") > -1) {
    var tutorialNumber = pageName.match(/tour([0-9]+)/)[1];
    var tutorial = new window.Tutorial(tutorialNumber);
    tutorials.push(tutorial);
    tutorial.start();
  }
});

// Start a tutorial if set previously
window.Tutorial.startOnOpen();

// Define javascript trigered steps in tutorials
// first index is the tour number, second index is the step in which
// the javascript should be triggered.
//
// So this means "in tutorial 3 when step 1 is activated
// set the editor line marker and select the DOM element returned.
//window.Tutorial.tour[3] = {
  //1: function() {
    //// Mark the value function in the editor
    //editor.setMarker(6, 8);
    //return document.querySelector(".ace_text-layer .ace_line:nth-child(6)");
  //}
//};
