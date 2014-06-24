var FormError = function(selector, value, message) {
  this.selector = selector;
  this.value = value;
  this.message = message;
};

var FormErrors = function(rule) {
  this._errors = [];
  this.rule = rule;
};

FormErrors.prototype.add = function(selector, value, message) {
  var formError = new FormError(selector, value, message);
  this._errors.push(formError);
  return this;
};

FormErrors.prototype.get = function() {
  return this._errors;
};
