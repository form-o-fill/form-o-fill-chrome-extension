webpackJsonp([1],[
/* 0 */
/*!****************************!*\
  !*** ./content/content.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _overlay = __webpack_require__(/*! ./overlay */ 17);
	
	var _overlay2 = _interopRequireDefault(_overlay);
	
	var _logger = __webpack_require__(/*! ../debug/logger */ 2);
	
	var _logger2 = _interopRequireDefault(_logger);
	
	var _jquery = __webpack_require__(/*! jquery */ 8);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _jsonf = __webpack_require__(/*! ../global/jsonf */ 4);
	
	var _jsonf2 = _interopRequireDefault(_jsonf);
	
	var _form_filler = __webpack_require__(/*! ./form_filler */ 14);
	
	var _form_filler2 = _interopRequireDefault(_form_filler);
	
	var _libs = __webpack_require__(/*! ../global/libs */ 13);
	
	var _libs2 = _interopRequireDefault(_libs);
	
	var _context_menu = __webpack_require__(/*! ./context_menu */ 18);
	
	var _context_menu2 = _interopRequireDefault(_context_menu);
	
	var _context = __webpack_require__(/*! ./context */ 21);
	
	var _context2 = _interopRequireDefault(_context);
	
	var _testing = __webpack_require__(/*! ./testing */ 22);
	
	var _testing2 = _interopRequireDefault(_testing);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_overlay2.default.init(); /*eslint complexity:0 */
	
	_context_menu2.default.init();
	_testing2.default.init();
	
	// These need to be GLOBAL for function resolution to work
	window.context = _context2.default;
	window.Libs = _libs2.default;
	_libs2.default.import();
	
	// This listens for messages coming from the background page
	// This is a long running communication channel
	chrome.runtime.onConnect.addListener(function (port) {
	  var errors = [];
	  var currentError = null;
	  var workingOverlayId = "form-o-fill-working-overlay";
	
	  var workingTimeout = null;
	  var takingLongTimeout = null;
	  var wontFinishTimeout = null;
	  var displayTimeout = null;
	
	  _logger2.default.info("[content.js] Got a connection from " + port.name);
	
	  if (port.name !== "FormOFill") {
	    return;
	  }
	
	  var overlayHtml = function overlayHtml(text, isVisible) {
	    if (typeof text === "undefined") {
	      text = "Form-O-Fill is working, please wait!";
	    }
	
	    if (typeof isVisible === "undefined") {
	      isVisible = false;
	    }
	    return "<div id='" + workingOverlayId + "' style='display: " + (isVisible ? "block" : "none") + ";'>" + text + "</div>";
	  };
	
	  // Hide overlay and cancel all timers
	  var hideOverlay = function hideOverlay() {
	    (0, _jquery2.default)("#" + workingOverlayId).remove();
	    clearTimeout(workingTimeout);
	    clearTimeout(takingLongTimeout);
	    clearTimeout(wontFinishTimeout);
	    clearTimeout(displayTimeout);
	  };
	
	  // Shows and hides a customized overlay throbber
	  var showOverlay = function showOverlay(message) {
	    hideOverlay();
	    (0, _jquery2.default)("body").find("#" + workingOverlayId).remove().end().append(overlayHtml(message, true));
	    displayTimeout = setTimeout(hideOverlay, 3000);
	  };
	
	  port.onMessage.addListener(function (message) {
	    _logger2.default.info("[content.js] Got message via port.onMessage : " + _jsonf2.default.stringify(message) + " from bg.js");
	
	    // Request to fill one field with a value
	    if (message.action === "fillField" && message.selector && message.value) {
	      _logger2.default.info("[content.js] Filling " + message.selector + " with value " + _jsonf2.default.stringify(message.value) + "; flags : " + _jsonf2.default.stringify(message.flags));
	
	      // REMOVE START
	      if (message.beforeData && message.beforeData !== null) {
	        _logger2.default.info("[content.js] Also got beforeData = " + _jsonf2.default.stringify(message.beforeData));
	      }
	      // REMOVE END
	
	      currentError = _form_filler2.default.fill(message.selector, message.value, message.beforeData, message.flags, message.meta);
	
	      // Remember the error
	      if (typeof currentError !== "undefined" && currentError !== null) {
	        _logger2.default.info("[content.js] Got error " + _jsonf2.default.stringify(currentError));
	        errors.push(currentError);
	      }
	
	      // Send a message that we are done filling the form
	      if (message.meta.lastField) {
	        _logger2.default.info("[content.js] Sending fillFieldFinished since we are done with the last field definition");
	
	        chrome.runtime.sendMessage({
	          "action": "fillFieldFinished",
	          "errors": _jsonf2.default.stringify(errors)
	        });
	      }
	    }
	
	    // request to return all accumulated errors
	    if (message.action === "getErrors") {
	      _logger2.default.info("[content.js] Returning " + errors.length + " errors to bg.js");
	      var response = {
	        "action": "getErrors",
	        "errors": _jsonf2.default.stringify(errors)
	      };
	      port.postMessage(response);
	    }
	
	    // Show Working overlay
	    // This should only be triggered for the default "WORKING"
	    // overlay.
	    // For the customized Lib.halt() message see down below
	    if (message.action === "showOverlay" && typeof message.message === "undefined") {
	      _logger2.default.info("[content.js] Showing working overlay");
	      if (document.querySelectorAll("#" + workingOverlayId).length === 0) {
	        (0, _jquery2.default)("body").append(overlayHtml());
	      }
	
	      // Show working overlay after some time
	      workingTimeout = setTimeout(function () {
	        (0, _jquery2.default)("#" + workingOverlayId).show();
	      }, 350);
	
	      // Show another overlay when things take REALLY long to finish
	      takingLongTimeout = setTimeout(function () {
	        (0, _jquery2.default)("#" + workingOverlayId).html("This is really taking too long.");
	      }, 5000);
	
	      // Finally if everything fails, clear overlay after 12 seconds
	      wontFinishTimeout = setTimeout(hideOverlay, 12000);
	    }
	
	    // Hide the overlay
	    if (message.action === "hideWorkingOverlay") {
	      _logger2.default.info("[content.js] Hiding working overlay");
	      hideOverlay();
	    }
	
	    // Show a custom message
	    if (message.action === "showMessage") {
	      showOverlay(message.message);
	    }
	
	    // reload the libraries
	    if (message.action === "reloadLibs") {
	      _libs2.default.import();
	    }
	
	    // execute setupContent function
	    if (message.action === "setupContent" && message.value) {
	      _logger2.default.info("[content.js] Executing setupContent function", message.value);
	
	      // Parse and execute function
	      var error = null;
	
	      try {
	        _jsonf2.default.parse(message.value)();
	      } catch (e) {
	        _logger2.default.error("[content.js] error while executing setupContent function");
	        error = e.message;
	      }
	
	      port.postMessage({ action: "setupContentDone", value: _jsonf2.default.stringify(error) });
	    }
	
	    // execute teardownContent function
	    // It has jQuery available and the context object from value functions and setupContent
	    if (message.action === "teardownContent" && message.value) {
	      _logger2.default.info("[content.js] Executing teardownContent function", message.value);
	
	      try {
	        _jsonf2.default.parse(message.value)();
	      } catch (e) {
	        _logger2.default.error("[content.js] error while executing teardownContent function");
	      }
	    }
	  });
	
	  // Simple one-shot callbacks
	  chrome.runtime.onMessage.addListener(function (message, sender, responseCb) {
	    _logger2.default.info("[content.js] Got message via runtime.onMessage : " + _jsonf2.default.stringify(message) + " from bg.j");
	
	    // This is the content grabber available as context.findHtml() in before functions
	    if (message.action === "grabContentBySelector") {
	      _logger2.default.info("[content.js] Grabber asked for '" + message.message + "'");
	      var domElements = (0, _jquery2.default)(message.message).map(function (index, $el) {
	        return $el;
	      });
	      if (domElements.length === 0) {
	        responseCb([]);
	      } else if (domElements.length === 1) {
	        responseCb(domElements[0].outerHTML);
	      } else {
	        responseCb(domElements.map(function (el) {
	          return el.outerHTML;
	        }));
	      }
	    }
	
	    // Show a custom message
	    // This appears twice in c/content.js because it uses a port and a one-shot
	    // listener
	    if (message.action === "showOverlay" && typeof message.message !== "undefined") {
	      showOverlay(message.message);
	      responseCb();
	    }
	
	    // Save a variable set in background via storage.set in the context of the content script
	    // This makes the storage usable in value functions
	    if (message.action === "storageSet" && typeof message.key !== "undefined" && typeof message.value !== "undefined") {
	      _logger2.default.info("[content.js] Saving " + message.key + " = " + message.value);
	      window.sessionStorage.setItem(message.key, message.value);
	    }
	
	    // Must return true to signal chrome that we do some work
	    // asynchronously (see https://developer.chrome.com/extensions/runtime#event-onMessage)
	    return true;
	  });
	});

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */
/*!****************************!*\
  !*** ./content/overlay.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _jquery = __webpack_require__(/*! jquery */ 8);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _logger = __webpack_require__(/*! ../debug/logger */ 2);
	
	var _logger2 = _interopRequireDefault(_logger);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var workingOverlayId = "form-o-fill-working-overlay";
	var workingTimeout = null;
	var takingLongTimeout = null;
	var wontFinishTimeout = null;
	var displayTimeout = null;
	
	var overlayHtml = function overlayHtml(text, isVisible) {
	  if (typeof text === "undefined") {
	    text = "Form-O-Fill is working, please wait!";
	  }
	
	  if (typeof isVisible === "undefined") {
	    isVisible = false;
	  }
	  return "<div id='" + workingOverlayId + "' style='display: " + (isVisible ? "block" : "none") + ";'>" + text + "</div>";
	};
	
	// Hide overlay and cancel all timers
	var hideOverlay = function hideOverlay() {
	  (0, _jquery2.default)("#" + workingOverlayId).remove();
	  clearTimeout(workingTimeout);
	  clearTimeout(takingLongTimeout);
	  clearTimeout(wontFinishTimeout);
	  clearTimeout(displayTimeout);
	};
	
	// Shows and hides a customized overlay throbber
	var showOverlay = function showOverlay(message) {
	  hideOverlay();
	  (0, _jquery2.default)("body").find("#" + workingOverlayId).remove().end().append(overlayHtml(message, true));
	  displayTimeout = setTimeout(hideOverlay, 1500);
	};
	
	// This listens for messages coming from the background page
	// This is a long running communication channel
	var portListener = function portListener() {
	  chrome.runtime.onConnect.addListener(function (port) {
	    port.onMessage.addListener(function (message) {
	      // Show Working overlay
	      // This should only be triggered for the default "WORKING"
	      // overlay.
	      // For the customized Lib.halt() message see down below
	      if (message.action === "showOverlay" && typeof message.message === "undefined") {
	        _logger2.default.info("[content.js] Showing working overlay");
	        if (document.querySelectorAll("#" + workingOverlayId).length === 0) {
	          (0, _jquery2.default)("body").append(overlayHtml());
	        }
	
	        // Show working overlay after some time
	        workingTimeout = setTimeout(function () {
	          (0, _jquery2.default)("#" + workingOverlayId).show();
	        }, 350);
	
	        // Show another overlay when things take REALLY long to finish
	        takingLongTimeout = setTimeout(function () {
	          (0, _jquery2.default)("#" + workingOverlayId).html("This is really taking too long.");
	        }, 5000);
	
	        // Finally if everything fails, clear overlay after 12 seconds
	        wontFinishTimeout = setTimeout(hideOverlay, 12000);
	      }
	
	      // Hide the overlay
	      if (message.action === "hideWorkingOverlay") {
	        _logger2.default.info("[content.js] Hiding working overlay");
	        hideOverlay();
	      }
	
	      // Show a custom message
	      if (message.action === "showMessage") {
	        showOverlay(message.message);
	      }
	    });
	  });
	};
	
	var runtimeListener = function runtimeListener() {
	  chrome.runtime.onMessage.addListener(function (message, sender, responseCb) {
	    // Show a custom message
	    // This appears twice in c/content.js because it uses a port and a one-shot
	    // listener
	    if (message.action === "showOverlay" && typeof message.message !== "undefined") {
	      showOverlay(message.message);
	      responseCb();
	    }
	  });
	};
	
	var Overlay = {
	  init: function init() {
	    runtimeListener();
	    portListener();
	  }
	};
	
	module.exports = Overlay;

/***/ },
/* 18 */
/*!*********************************!*\
  !*** ./content/context_menu.js ***!
  \*********************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _extract_instrumentation = __webpack_require__(/*! ./extract_instrumentation */ 19);
	
	var Extractor = _interopRequireWildcard(_extract_instrumentation);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var lastRightClickedElement = null;
	
	var ContextMenu = {
	  init: function init() {
	    document.addEventListener("mousedown", function (event) {
	      // right click
	      if (event.button === 2 && typeof event.target.form !== "undefined") {
	        lastRightClickedElement = event.target;
	      }
	    }, true);
	
	    // When we receive the message to extract a form
	    // from bg.js we can just extract the form from the last saved element
	    chrome.extension.onMessage.addListener(function (message) {
	      if (message.action === "extractLastClickedForm") {
	        Extractor.extractRules(lastRightClickedElement.form);
	      }
	    });
	  }
	};
	
	module.exports = ContextMenu;

/***/ },
/* 19 */
/*!********************************************!*\
  !*** ./content/extract_instrumentation.js ***!
  \********************************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _jquery = __webpack_require__(/*! jquery */ 8);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _form_extractor = __webpack_require__(/*! ./form_extractor */ 20);
	
	var _form_extractor2 = _interopRequireDefault(_form_extractor);
	
	var _logger = __webpack_require__(/*! ../debug/logger */ 2);
	
	var _logger2 = _interopRequireDefault(_logger);
	
	var _jsonf = __webpack_require__(/*! ../global/jsonf */ 4);
	
	var _jsonf2 = _interopRequireDefault(_jsonf);
	
	var _utils = __webpack_require__(/*! ../global/utils */ 5);
	
	var _utils2 = _interopRequireDefault(_utils);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// Create HTML overlays for form masking
	var getOverlays = function getOverlays() {
	  var overlays = [];
	  (0, _jquery2.default)("form").each(function formEach(index) {
	    var $form = (0, _jquery2.default)(this);
	
	    // Add an index so we can find the form later
	    $form.attr("data-form-o-fill-id", index);
	
	    // Dimensions
	    var offset = $form.offset();
	    var height = $form.height();
	    var width = $form.width();
	
	    // HTML
	    var overlay = "<div data-form-o-fill-id='" + index + "' class='form-o-fill-overlay-form' style='top:" + offset.top + "px; left:" + offset.left + "px; width:" + width + "px; height:" + height + "px;'><div class='form-o-fill-overlay-text'>Form-O-Fill:<br />Click in the colored area to extract this form</div></div>";
	    overlays.push(overlay);
	  });
	  return overlays.join();
	};
	
	var cleanupOverlays = function cleanupOverlays() {
	  // cleanup
	  (0, _jquery2.default)("form").each(function formEach() {
	    (0, _jquery2.default)(this).removeAttr("form-o-fill-id");
	  });
	  (0, _jquery2.default)(".form-o-fill-overlay-form").remove();
	  (0, _jquery2.default)(document).off("click", ".form-o-fill-overlay-form").off("click", "body");
	};
	
	var extractRules = function extractRules(targetForm) {
	  // looks good, start extraction
	  var ruleCode = _form_extractor2.default.extract(targetForm);
	  _logger2.default.info("[extract_instr.js] Extracted: " + JSON.stringify(ruleCode));
	
	  // Save Rule and goto options.html
	  Storage.save(ruleCode, _utils2.default.keys.extractedRule);
	
	  chrome.runtime.sendMessage({ "action": "extractFinishedNotification" });
	};
	
	// Show the extract overlay and bind handlers
	var showExtractOverlay = function showExtractOverlay() {
	  // Add event listener to DOM
	  (0, _jquery2.default)(document).on("click", ".form-o-fill-overlay-form", function clickFofOverlay(e) {
	    e.preventDefault();
	    e.stopPropagation();
	
	    // This is the form we must extract
	    var targetForm = document.querySelector("form[data-form-o-fill-id='" + this.dataset.formOFillId + "']");
	
	    // remove overlays etc
	    cleanupOverlays();
	
	    if (targetForm) {
	      extractRules(targetForm);
	    }
	  }).on("click", "body", cleanupOverlays).on("keyup", function keyUp(e) {
	    if (e.which === 27) {
	      cleanupOverlays();
	    }
	  });
	
	  // Attach overlays to DOM
	  (0, _jquery2.default)("body").append(getOverlays());
	};
	
	// This is a one-off message listener
	chrome.runtime.onMessage.addListener(function extractInstOnMessage(message, sender, responseCallback) {
	  // Request to start extracting a form to rules
	  if (message && message.action === "showExtractOverlay") {
	    showExtractOverlay();
	  }
	
	  // Request to match rules against content
	  // Done here to not send the whole HTML to bg.js
	  if (message && message.action === "matchContent" && message.rules) {
	    var content = document.querySelector("body").outerHTML;
	    var matches = [];
	    var rules = _jsonf2.default.parse(message.rules);
	    rules.forEach(function forEach(rule) {
	      if (typeof rule.content.test === "function" && rule.content.test(content)) {
	        matches.push(rule.id);
	      }
	    });
	    _logger2.default.info("[extract_instr.js] Matched content against " + rules.length + " rules with " + matches.length + " content matches");
	    responseCallback(_jsonf2.default.stringify(matches));
	  }
	});
	
	module.exports = {
	  extractRules: extractRules,
	  showExtractOverlay: showExtractOverlay
	};

/***/ },
/* 20 */
/*!***********************************!*\
  !*** ./content/form_extractor.js ***!
  \***********************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _logger = __webpack_require__(/*! ../debug/logger */ 2);
	
	var _logger2 = _interopRequireDefault(_logger);
	
	var _jquery = __webpack_require__(/*! jquery */ 8);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _rule = __webpack_require__(/*! ../global/rule */ 7);
	
	var _rule2 = _interopRequireDefault(_rule);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var FormExtractor = {
	  _knownElements: null,
	  knownElements: function knownElements() {
	    if (this._knownElements) {
	      return this._knownElements;
	    }
	    var inputs = ["text", "checkbox", "image", "password", "radio", "search", "email", "url", "tel", "number", "range", "date", "month", "week", "time", "datetime", "datetime-local", "color"];
	    var tags = ["button", "textarea", "select"];
	    this._knownElements = inputs.map(function (inputType) {
	      return "input[type=" + inputType + "]";
	    });
	    this._knownElements = this._knownElements.concat(tags);
	    return this._knownElements;
	  },
	  extract: function extract(domNodeStartExtractionHere) {
	    var extractor = this;
	    var $form = (0, _jquery2.default)(domNodeStartExtractionHere);
	    var ruleData = {
	      "url": document.location.href,
	      "name": "A rule for " + document.location.href,
	      "fields": []
	    };
	
	    this.knownElements().forEach(function (selector) {
	      _logger2.default.info("[form_extractor.js] Looking for '" + selector + "'");
	      $form.find(selector).each(function () {
	        _logger2.default.info("[form_extractor.js] Found a '" + this.type + "' (" + this.value + ") <" + this.name + ">");
	        var value = extractor._valueFor(this);
	        // Only include field if value !== null
	        if (value !== null) {
	          var field = {
	            "selector": extractor._selectorFor(this),
	            "value": value
	          };
	          ruleData.fields.push(field);
	        }
	      });
	    });
	
	    return _rule2.default.create(ruleData).prettyPrint();
	  },
	  _selectorFor: function _selectorFor(domNode) {
	    var method = this._method("selector", domNode);
	    return method(domNode);
	  },
	  _valueFor: function _valueFor(domNode) {
	    var method = this._method("value", domNode);
	    return method(domNode);
	  },
	  _selectorDefault: function _selectorDefault(domNode) {
	    return "input[name='" + domNode.name + "']";
	  },
	  _selectorButton: function _selectorButton(domNode) {
	    return "button[name='" + domNode.name + "']";
	  },
	  _selectorTextarea: function _selectorTextarea(domNode) {
	    return "textarea[name='" + domNode.name + "']";
	  },
	  _selectorSelectOne: function _selectorSelectOne(domNode) {
	    return "select[name='" + domNode.name + "']";
	  },
	  _selectorSelectMultiple: function _selectorSelectMultiple(domNode) {
	    return "select[name='" + domNode.name + "']";
	  },
	  _valueDefault: function _valueDefault(domNode) {
	    return domNode.value;
	  },
	  _valueCheckbox: function _valueCheckbox(domNode) {
	    // if checked include the checkbox in the rule
	    return domNode.checked ? true : false;
	  },
	  _valueRadio: function _valueRadio(domNode) {
	    // if checked include the radiobutton in the rule
	    return domNode.checked ? domNode.value : null;
	  },
	  _valueSelectOne: function _valueSelectOne(domNode) {
	    var optionNode = null;
	    var i;
	    for (i = 0; i < domNode.children.length; i++) {
	      optionNode = domNode.children[i];
	      if (optionNode.selected) {
	        return optionNode.value;
	      }
	    }
	    return "";
	  },
	  _valueSelectMultiple: function _valueSelectMultiple(domNode) {
	    var i = 0;
	    var optionNode = null;
	    var selected = [];
	
	    for (i = 0; i < domNode.children.length; i++) {
	      optionNode = domNode.children[i];
	      if (optionNode.selected) {
	        selected.push(optionNode.value);
	      }
	    }
	
	    return selected;
	  },
	  _method: function _method(prefix, domNode) {
	    var valueMethod = this[this._typeMethod(prefix, domNode.type)];
	    // Default is to set the value of the field if
	    // no special function is defined for that type
	    if (typeof valueMethod !== "function") {
	      valueMethod = this["_" + prefix + "Default"];
	    }
	    return valueMethod;
	  },
	  _typeMethod: function _typeMethod(prefix, type) {
	    return ("_" + prefix + "-" + type).replace(/(\-[a-z])/g, function ($1) {
	      return $1.toUpperCase().replace('-', '');
	    });
	  }
	}; /* eslint no-unused-vars: 0 */
	
	module.exports = FormExtractor;

/***/ },
/* 21 */
/*!****************************!*\
  !*** ./content/context.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _jsonf = __webpack_require__(/*! ../global/jsonf */ 4);
	
	var _jsonf2 = _interopRequireDefault(_jsonf);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// This is not the same context as in background.js
	// Currently it only allows to read storage values set by bg.js but
	// you can set value for all value functions to access
	var context = {
	  storage: {
	    get: function get(key) {
	      var value = window.sessionStorage.getItem(key);
	      if (typeof value !== "undefined") {
	        return _jsonf2.default.parse(value);
	      }
	      return value;
	    },
	    set: function set(key, value) {
	      // set it in localstorage
	      window.sessionStorage.setItem(key, _jsonf2.default.stringify(value));
	    }
	  }
	}; /*eslint no-unused-vars: 0 */
	
	module.exports = context;

/***/ },
/* 22 */
/*!****************************!*\
  !*** ./content/testing.js ***!
  \****************************/
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _logger = __webpack_require__(/*! ../debug/logger */ 2);
	
	var _logger2 = _interopRequireDefault(_logger);
	
	var _jquery = __webpack_require__(/*! jquery */ 8);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _utils = __webpack_require__(/*! ../global/utils */ 5);
	
	var _utils2 = _interopRequireDefault(_utils);
	
	var _extract_instrumentation = __webpack_require__(/*! ./extract_instrumentation */ 19);
	
	var _extract_instrumentation2 = _interopRequireDefault(_extract_instrumentation);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// This file is for end to end testing only
	// It is delivered with the production code but disabled
	
	var installTestingCode = function installTestingCode() {
	
	  var shouldLog = !(0, _jquery2.default)("body").hasClass("test-no-log");
	
	  var Testing = {
	    setTestingVar: function setTestingVar(key, value, text) {
	      var $info = (0, _jquery2.default)("#form-o-fill-testing-info");
	      var foundEl = $info.find("." + key);
	      // When the text property is set, append that to the DOM
	      if (foundEl.length === 0 && typeof text !== "undefined") {
	        $info.append("<tr><td>" + text + "</td><td class='" + key + "'>" + value + "</td></tr>");
	      } else {
	        $info.find("." + key).html(value);
	      }
	    },
	    appendTestLog: function appendTestLog(msg) {
	      if (shouldLog) {
	        (0, _jquery2.default)("td.log ul").append("<li>" + msg + "</li>");
	      }
	    }
	  };
	
	  // Tell the background page that we are in testing mode
	  chrome.runtime.sendMessage({ action: "setTestingMode", value: true }, function (bgInfo) {
	    // The background page returns a lot of metadata about the extension
	    // Display that in the testing page which has a special container for that.
	    // That information is then picked up by the integration tests to reach intern URLs like
	    // the options page
	    _logger2.default.info("[c/testing.j] background.js has set testing mode to " + bgInfo.testingMode);
	    Testing.setTestingVar("extension-id", bgInfo.extensionId, "Extension Id");
	    Testing.setTestingVar("extension-options-url", "<a target='_self' href='chrome-extension://" + bgInfo.extensionId + "/html/options.html'>chrome-extension://" + bgInfo.extensionId + "/html/options.html</a>", "Options URL");
	    Testing.setTestingVar("tab-id", bgInfo.tabId, "TabId of this page");
	    Testing.setTestingVar("extension-version", bgInfo.extensionVersion, "Form-O-Fill Version");
	    Testing.setTestingVar("testing-mode", bgInfo.testingMode, "Testing mode");
	    Testing.setTestingVar("rule-count", bgInfo.ruleCount, "Number of rules");
	    Testing.setTestingVar("lib-count", bgInfo.libCount, "Number of library functions");
	    Testing.setTestingVar("log", "<ul></ul>", "Log");
	  });
	
	  // Listen to messages from background.js
	  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	    // Set a variable in the DOM based on what is sent from bg.js
	    if (message.action === "setTestingVar" && message.key && typeof message.value !== "undefined") {
	      Testing.setTestingVar(message.key, message.value, message.text);
	      sendResponse(true);
	    }
	
	    if (message.action === "appendTestLog" && typeof message.value !== "undefined") {
	      Testing.appendTestLog(message.value);
	      sendResponse(true);
	    }
	  });
	
	  //
	  // Bind some handlers to make working with the testcases
	  // easier
	  (0, _jquery2.default)(document).on("click", "#form-o-fill-testing-import-submit", function () {
	    // Attach an listener to the <button> so that the rules that should be imported can be send
	    // to the background/testing.js page
	    // There is a little "obfuscating" involved (see replace) to help testing.
	    var rulesCode = (0, _jquery2.default)("#form-o-fill-testing-import").val().replace(/([a-zA-Z])@([a-zA-Z])/g, "$1 $2");
	    chrome.runtime.sendMessage({ action: "importRules", value: rulesCode }, function () {
	      window.location.reload();
	    });
	  }).on("click", ".popup-html li.select-rule", function () {
	    // Clicks on the simulated popup should trigger filling
	    var domNode = this;
	    var data = (0, _jquery2.default)(this).data();
	    var message = {
	      "action": "fillWithRule",
	      "index": data.ruleIndex,
	      "id": data.ruleId
	    };
	    chrome.extension.sendMessage(message, function () {
	      Testing.setTestingVar("rule-filled-id", message.id, "Filled form with rule #id");
	      Testing.setTestingVar("rule-filled-name", domNode.innerHTML, "Filled form with rule #name");
	      domNode = null;
	    });
	  }).on("click", ".extension-options-url", function () {
	    // Simulate a click on the testing options link
	    _utils2.default.openOptions();
	  }).on("click", "a.cmd-show-extract-overlay", function () {
	    // Execute extract form function
	    _extract_instrumentation2.default.showExtractOverlay();
	  }).on("click", ".popup-html li.select-workflow", function () {
	    // Clicks on the simulated popup should trigger workflow
	    var domNode = this;
	    var data = (0, _jquery2.default)(this).data();
	    var message = {
	      "action": "fillWithWorkflow",
	      "index": data.workflowIndex,
	      "id": data.workflowId
	    };
	    chrome.extension.sendMessage(message, function () {
	      Testing.setTestingVar("rule-filled-id", message.id, "Filled form with workflow #id");
	      Testing.setTestingVar("rule-filled-name", domNode.innerHTML, "Filled form with workflow #name");
	      domNode = null;
	    });
	  }).on("click", ".cmd-toggle-re-match", function () {
	    // Click on rematch button should activate rematch mode
	    chrome.extension.sendMessage({ action: "testToggleRematch" });
	  });
	
	  // Make the Testn object available in dev
	  if (!_utils2.default.isLiveExtension()) {
	    window.Testing = Testing;
	  }
	};
	
	var Testing = {
	  init: function init() {
	    // Enable only if we are running inside a special testing URL and are not bound to the live extension ID
	    if (!_utils2.default.isLiveExtension() && /http:\/\/localhost:9292\/form-o-fill-testing\//.test(window.location.href)) {
	      installTestingCode();
	      _logger2.default.info("[c/testing.js] Installed testing code in content page");
	    }
	  }
	};
	
	module.exports = Testing;

/***/ }
]);
//# sourceMappingURL=content.map