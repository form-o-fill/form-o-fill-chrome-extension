/*global jQuery, Rule, Utils*/
var FormExtractor = {
  _knownElements: null,
  knownElements: function() {
    if(this._knownElements) {
      return this._knownElements;
    }
    var inputs = [
      "text",
      "checkbox",
      "image",
      "password",
      "radio",
      "search",
      "email",
      "url",
      "tel",
      "number",
      "range",
      "date",
      "month",
      "week",
      "time",
      "datetime",
      "datetime-local",
      "color"
    ];
    var tags = [
      "button",
      "textarea",
      "select"
    ];
    this._knownElements = inputs.map(function (inputType) {
      return "input[type=" + inputType + "]";
    });
    this._knownElements = this._knownElements.concat(tags);
    return this._knownElements;
  },
  extract: function(domNodeStartExtractionHere) {
    var extractor = this;
    var $form = jQuery(domNodeStartExtractionHere);
    var ruleData = {
      "url": document.location.href,
      "name": "A rule for " + document.location.href,
      "fields": []
    };

    this.knownElements().forEach(function (selector) {
      Utils.log("[Extract] Looking for '" + selector + "'");
      $form.find(selector).each(function() {
        Utils.log("[Extract] Found a '" + this.type + "' (" + this.value + ")");
        var value = extractor._valueFor(this);
        // Only include field if value !== null
        if(value !== null) {
          var field = {
            "selector": extractor._selectorFor(this),
            "value": value
          };
          ruleData.fields.push(field);
        }
      });
    });

    return Rule.create(ruleData).prettyPrint();
  },
  _selectorFor: function(domNode) {
    var method = this._method("selector", domNode);
    return method(domNode);
  },
  _valueFor: function(domNode) {
    var method = this._method("value", domNode);
    return method(domNode);
  },
  _selectorDefault: function(domNode) {
    return "input[name='" + domNode.name + "']";
  },
  _selectorButton: function(domNode) {
    return "button[name='" + domNode.name + "']";
  },
  _selectorTextarea: function(domNode) {
    return "textarea[name='" + domNode.name + "']";
  },
  _selectorSelectOne: function(domNode) {
    return "select[name='" + domNode.name + "']";
  },
  _selectorSelectMultiple: function(domNode) {
    return "select[name='" + domNode.name + "']";
  },
  _valueDefault: function(domNode) {
    return domNode.value;
  },
  _valueCheckbox: function(domNode) {
    // if checked include the checkbox in the rule
    return domNode.checked ? true : null;
  },
  _valueRadio: function(domNode) {
    // if checked include the radiobutton in the rule
    return domNode.checked ? domNode.value : null;
  },
  _valueSelectOne: function(domNode) {
    var optionNode = null;
    var i;
    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      if(optionNode.selected) {
        return optionNode.value;
      }
    }
    return "";
  },
  _valueSelectMultiple: function(domNode) {
    var i = 0;
    var optionNode = null;
    var selected = [];

    for(i = 0; i < domNode.children.length; i++) {
      optionNode = domNode.children[i];
      if (optionNode.selected) {
        selected.push(optionNode.value);
      }
    }

    return selected;
  },
  _method: function(prefix, domNode) {
    var valueMethod = this[this._typeMethod(prefix, domNode.type)];
    // Default is to set the value of the field if
    // no special function is defined for that type
    if (typeof valueMethod !== "function") {
      valueMethod = this["_" + prefix + "Default"];
    }
    return valueMethod;
  },
  _typeMethod: function(prefix, type) {
    return ("_" + prefix + "-" + type).replace(/(\-[a-z])/g, function($1) {
      return $1.toUpperCase().replace('-','');
    });
  }
};
