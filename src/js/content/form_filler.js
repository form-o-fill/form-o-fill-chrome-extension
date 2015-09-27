/*global FormError, jQuery, JSONF, Logger, Utils */
/*eslint complexity:0, no-unused-vars: 0, max-params: 5*/
var FormFiller = {
  error: null,
  // This fills the field with a value
  fill: function(selector, value, beforeData, flags, meta) {
    var domNodes = document.querySelectorAll(selector);
    var domNode = null;
    var fillMethod = null;

    if (domNodes.length === 0) {
      return new FormError(selector, value, "Could not find field");
    }
    Logger.info("[form_filler.js] Filling " + domNodes.length + " fields on the page");

    var parsedValue = JSONF.parse(value);

    // Call field specific method on EVERY field found
    //
    // "_fill" + the camelized version of one of these:
    // text , button , checkbox , image , password , radio , textarea , select-one , select-multiple , search
    // email , url , tel , number , range , date , month , week , time , datetime , datetime-local , color
    //
    // eg. _fillDatetimeLocal(value)
    var i;
    var returnValue = null;

    for (i = 0; i < domNodes.length; ++i) {
      domNode = domNodes[i];
      fillMethod = this._fillMethod(domNode);

      // Check for "onlyEmpty" flag and break the loop
      if(flags.onlyEmpty === true && domNode.value !== "") {
        Logger.info("[form_filler.js] Skipped the loop because the target was not empty");
        break;
      }

      // if the value is a function, call it with the jQuery wrapped domNode
      // The value for 'Libs' and 'context' are implicitly passed in by defining them on the sandboxed window object
      if(typeof parsedValue === "function") {
        try {
          parsedValue = parsedValue(jQuery(domNode), beforeData);
        } catch (e) {
          Logger.info("[form_filler.js] Got an exception executing value function: " + parsedValue);
          Logger.info("[form_filler.js] Original exception: " + e);
          Logger.info("[form_filler.js] Original stack: " + e.stack);
          return new FormError(selector, value, "Error while executing value-function: " + JSONF.stringify(e.message));
        }
      }

      // Fill field only if value is not null or not defined
      if(parsedValue !== null && typeof parsedValue !== "undefined") {
        // Fill field using the specialized method or default
        returnValue = fillMethod(domNode, parsedValue, selector) || null;
      }

      // Screenshot?
      if(flags.screenshot !== "undefined") {
        // Only the BG page has the permissions to do a screenshot
        // so here we send it the request to do so
        Logger.info("[form_filler.js] sending request to take a screenshot to bg.js");
        chrome.runtime.sendMessage({action: "takeScreenshot", value: meta, flag: flags.screenshot});
      }

    }

    return returnValue;
  },
  _fillDefault: function(domNode, value) {
    domNode.value = value;
  },
  _fillImage: function(domNode, value) {
    domNode.attributes.getNamedItem("src").value = value;
  },
  _fillCheckbox: function(domNode, value) {
    var setValue;
    if (value === true || domNode.value === value) {
      setValue = true;
    }
    if (value === false) {
      setValue = false;
    }
    domNode.checked = setValue;
  },
  _fillRadio: function(domNode, value) {
    domNode.checked = domNode.value === value;
  },
  _fillSelectOne: function(domNode, value) {
    var i = 0;
    var optionNode = null;
    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      if(optionNode.value === value) {
        optionNode.selected = value;
        return;
      }
    }
  },
  _fillSelectMultiple: function(domNode, value) {
    var i = 0;
    var optionNode = null;
    var someFunction = function(targetValue) {
      return optionNode.value === targetValue;
    };
    value = Array.isArray(value) ? value : [value];

    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      optionNode.selected = value.some(someFunction);
    }
  },
  _fillDate: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'date' field cannot be filled with this. See http://bit.ly/formofill-formats");
    }
  },
  _fillMonth: function(domNode, value, selector) {
    if(/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'month' field cannot be filled with this value. See http://bit.ly/formofill-format-month");
    }
  },
  _fillWeek: function(domNode, value, selector) {
    if(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0123])$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'week' field cannot be filled with tihs value. See http://bit.ly/formofill-format-week");
    }
  },
  _fillTime: function(domNode, value, selector) {
    if(/^(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'time' field cannot be filled with this value. See http://bit.ly/formofill-format-time");
    }
  },
  _fillDatetime: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)([T|Z][^\d]|[+-][01][0-4]:\d\d)$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'datetime' field cannot be filled with this value. See http://bit.ly/formofill-format-date-time");
    }
  },
  _fillDatetimeLocal: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'datetime-local' field cannot be filled with this value. See http://bit.ly/formofill-format-date-time-local");
    }
  },
  _fillColor: function(domNode, value, selector) {
    if(/^#[0-9a-f]{6}$/i.test(value)) {
      domNode.value = value;
    } else {
      return new FormError(selector, value, "'color' field cannot be filled with this value. See http://bit.ly/formofill-format-color");
    }
  },
  _typeMethod: function(type) {
    return ("_fill-" + type).replace(/(\-[a-z])/g, function($1) {
      return $1.toUpperCase().replace('-', '');
    });
  },
  _fillMethod: function(domNode) {
    var fillMethod = this[this._typeMethod(domNode.type)];
    // Default is to set the value of the field if
    // no special function is defined for that type
    if (typeof fillMethod !== "function") {
      fillMethod = this._fillDefault;
    }
    return fillMethod;
  }
};

