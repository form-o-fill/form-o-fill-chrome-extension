/*global Errors, jQuery, JSONF*/
var FormFiller = {
  fill: function(selector, value) {
    Errors.init();
    var domNodes = document.querySelectorAll(selector);
    var domNode = null;

    if (domNodes.length === 0) {
      Errors.add("Could not find a field (" + selector + ")");
      return false;
    }

    var parsedValue = JSONF.parse(value);
    // if the value is a function, call it with the jQuery wrapped domNode
    if(typeof parsedValue === "function") {
      parsedValue = parsedValue(jQuery(domNode));
    }

    // Fill field only if value is not null
    if(parsedValue === null) {
      return false;
    }

    // Call field specific method on EVERY field found
    //
    // "_fill" + the camelized version of one of these:
    // text , button , checkbox , image , password , radio , textarea , select-one , select-multiple , search
    // email , url , tel , number , range , date , month , week , time , datetime , datetime-local , color
    //
    // eg. _fillDatetimeLocal(value)
    for (var i = 0; i < domNodes.length; ++i) {
      domNode = domNodes[i];
      var fillMethod = this._fillMethod(domNode);

      // Fill field using the specialized method or default
      fillMethod(domNode, parsedValue, selector);
    }

  },
  _fillDefault: function(domNode, value) {
    domNode.value = value;
  },
  _fillCheckbox: function(domNode, value) {
    domNode.checked = value;
  },
  _fillRadio: function(domNode, value) {
    domNode.checked = (domNode.value === value);
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
      Errors.add("'date' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-formats");
    }
  },
  _fillMonth: function(domNode, value, selector) {
    if(/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'month' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-month");
    }
  },
  _fillWeek: function(domNode, value, selector) {
    if(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0123])$/.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'week' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-week");
    }
  },
  _fillTime: function(domNode, value, selector) {
    if(/^(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'time' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-time");
    }
  },
  _fillDatetime: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)([T|Z][^\d]|[+-][01][0-4]:\d\d)$/.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'datetime' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-date-time");
    }
  },
  _fillDatetimeLocal: function(domNode, value, selector) {
    if(/^\d{4}-\d{2}-\d{2}T(0\d|1\d|2[0-3]):([0-5]\d):([0-5]\d)(\.(\d{1,3}))?$/.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'datetime-local' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-date-time-local");
    }
  },
  _fillColor: function(domNode, value, selector) {
    if(/^#[0-9a-f]{6}$/i.test(value)) {
      domNode.value = value;
    } else {
      Errors.add("'color' field (" + selector + ") cannot be filled with '" + value + "'. See http://bit.ly/formofill-format-color");
    }
  },
  _typeMethod: function(type) {
    return ("_fill-" + type).replace(/(\-[a-z])/g, function($1) {
      return $1.toUpperCase().replace('-','');
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

