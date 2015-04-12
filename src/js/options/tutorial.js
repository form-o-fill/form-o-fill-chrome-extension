/*global jQuery introJs window exportWorkflowsData exportRulesData Storage Utils resetTabSetting editor saveRules*/
var tutorials = tutorials || [];

(function tutorialScope(jQuery) {
  "use strict";

  var tutorialRunning = false;

  var Tutorial = function(tourNumber) {
    this.tourNumber = tourNumber;
    this.steps = this.loadSteps(tourNumber);
    this.intro = this.initIntroJs();
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
        elementChanged: false
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

      if(typeof Tutorial.tour[tutorial.tourNumber] !== "undefined" && typeof Tutorial.tour[tutorial.tourNumber][step.index] === "function") {
        var target = Tutorial.tour[tutorial.tourNumber][step.index](step);
        if(target) {
          step.element = target;
          step.elementChanged = true;
        }
      }
    };
    /*eslint-enable complexity */
  };

  Tutorial.prototype.onAfterChangeHandler = function(tutorial) {
    return function() {
      /*eslint-disable no-underscore-dangle */
      var stepIndex = tutorial.intro._currentStep;
      var step = tutorial.intro._introItems[stepIndex];
      /*eslint-enable no-underscore-dangle */

      if(typeof Tutorial.tour[tutorial.tourNumber] !== "undefined" && typeof Tutorial.tour[tutorial.tourNumber][step.index] === "function") {
        var target = Tutorial.tour[tutorial.tourNumber][step.index](step);
        if(target) {
          step.element = target;
          step.elementChanged = true;
        }
      }

      var $helper = jQuery(".introjs-helperLayer");
      if(!step.overlay) {
        $helper.hide();
        jQuery(".introjs-overlay").hide();
      } else {
        $helper.show();
        jQuery(".introjs-overlay").show();
      }

      if(step.elementChanged) {
        var ePos = jQuery(step.element).offset();
        $helper.css("background-color", "transparent");
        jQuery(".introjs-tooltipReferenceLayer").css("top", ePos.top + "px").css("left", ePos.left + "px");
        jQuery(".introjs-fixParent").removeClass("introjs-fixParent");
      }
    };
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

    return intro;
  };

  Tutorial.prototype.start = function() {
    var tutorial = this;
    var selector = "a.tut-start-tour-" + tutorial.tourNumber;
    jQuery(selector).on("click", function() {
      tutorial.startTutorialMode().then(function() {
        tutorial.intro.start();
        tutorialRunning = true;
      });
    });
    this.observeDomChanges();
  };

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

  Tutorial.prototype.domObserver = function(tutorial) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    return new MutationObserver(function(mutations) {
      var added = [];
      var removed = [];
      var attrs = [];

      mutations.forEach(function (mutation) {
        added = added.concat(tutorial.mutatedClassNames(mutation.addedNodes));
        removed = removed.concat(tutorial.mutatedClassNames(mutation.removedNodes));
        attrs = attrs.concat(mutation.target.style.cssText);
      });

      /*eslint-disable complexity */
      tutorial.steps.every(function (step) {
        if(typeof step.trigger !== "undefined") {
          var typeToCheck = step.trigger[0];
          var triggerCls = step.trigger.substr(1);

          if(added.indexOf(triggerCls) !== -1) {
            if(typeToCheck === "+") {
              // Trigger Step
              tutorial.intro.goToStep(step.index + 1);
              return false;
            }

            if(typeToCheck === "-") {
              // Trigger Step
              tutorial.intro.goToStep(step.index + 1);
              return false;
            }
          }

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
        }
        /*eslint-enable complexity*/

        return true;
      });
    });
  };

  Tutorial.prototype.observeDomChanges = function() {
    this.observer = this.domObserver(this);

    this.observer.observe(window.document.querySelector("#notices"), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"]
    });
  };

  // This method activates the turorial mode:
  // 1. backup existing rules and workflows
  // 2. clear data
  // 3. insert rules stub
  Tutorial.prototype.startTutorialMode = function() {
    return new Promise(function(resolve) {
      // 1. backup data
      Promise.all([exportWorkflowsData(), exportRulesData()]).then(function(workflowsAndRules) {
        var exportJson = {
          workflows: workflowsAndRules[0],
          rules: workflowsAndRules[1]
        };

        Storage.save(exportJson, Utils.keys.tutorialDataBackup).then(function () {
          // 2. Clear data
          resetTabSetting();

          // 3. insert rule stub
          editor.setValue("var rules = [\n];");
          saveRules(1);
          resolve();
        });
      });
    });
  };

  window.Tutorial = Tutorial;

  jQuery(".menu").on("click", "a", function () {
    if(this.classList.contains("no-click") || !tutorialRunning) {
      return true;
    }
    tutorials.forEach(function (tutorial) {
      tutorial.intro.exit();
      tutorial.observer.disconnect();
    });
    tutorials = [];
    tutorialRunning = false;
    editor.removeAllMarkers();
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

