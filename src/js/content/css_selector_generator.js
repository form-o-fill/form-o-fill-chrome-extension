/*eslint-disable max-depth, no-sequences, complexity, yoda */
var CssSelectorGenerator = function(options) {
  if (options === null) {
    options = {};
  }
  this.options = {
    selectors: ['id', 'class', 'tag', 'nthchild']
  };
};

CssSelectorGenerator.prototype.isElement = function(element) {
  return !!((element !== null ? element.nodeType : void 0) === 1);
};

CssSelectorGenerator.prototype.getParents = function(element) {
  var currentElement, result;
  result = [];
  if (this.isElement(element)) {
    currentElement = element;
    while (this.isElement(currentElement)) {
      result.push(currentElement);
      currentElement = currentElement.parentNode;
    }
  }
  return result;
};

CssSelectorGenerator.prototype.getTagSelector = function(element) {
  return this.sanitizeItem(element.tagName.toLowerCase());
};

CssSelectorGenerator.prototype.sanitizeItem = function(item) {
  var characters;
  characters = (item.split('')).map(function(character) {
    if (character === ':') {
      return "\\" + (':'.charCodeAt(0).toString(16).toUpperCase()) + " ";
    } else if (/[ !"#$%&'()*+,.\/;<=>?@\[\\\]^`{|}~]/.test(character)) {
      return "\\" + character;
    }
    return escape(character).replace(/\%/g, '\\');
  });
  return characters.join('');
};

CssSelectorGenerator.prototype.getIdSelector = function(element) {
  var id, sanitizedId;
  id = element.getAttribute('id');
  if ((id !== null) && (id !== '') && !(/\s/.exec(id)) && !(/^\d/.exec(id))) {
    sanitizedId = "#" + (this.sanitizeItem(id));
    if (element.ownerDocument.querySelectorAll(sanitizedId).length === 1) {
      return sanitizedId;
    }
  }
  return null;
};

CssSelectorGenerator.prototype.getClassSelectors = function(element) {
  var classString, item, result;
  result = [];
  classString = element.getAttribute('class');
  if (classString !== null) {
    classString = classString.replace(/\s+/g, ' ');
    classString = classString.replace(/^\s|\s$/g, '');
    if (classString !== '') {
      result = function() {
        var k, len, ref, results;
        ref = classString.split(/\s+/);
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          item = ref[k];
          results.push("." + (this.sanitizeItem(item)));
        }
        return results;
      }.call(this);
    }
  }
  return result;
};

CssSelectorGenerator.prototype.getAttributeSelectors = function(element) {
  var attribute, blacklist, k, len, ref, ref1, result;
  result = [];
  blacklist = ['id', 'class'];
  ref = element.attributes;
  for (k = 0, len = ref.length; k < len; k++) {
    attribute = ref[k];
    if (ref1 = attribute.nodeName, blacklist.indexOf(ref1) < 0) {
      result.push("[" + attribute.nodeName + "=" + attribute.nodeValue + "]");
    }
  }
  return result;
};

CssSelectorGenerator.prototype.getNthChildSelector = function(element) {
  var counter, k, len, parentElement, sibling, siblings;
  parentElement = element.parentNode;
  if (parentElement !== null) {
    counter = 0;
    siblings = parentElement.childNodes;
    for (k = 0, len = siblings.length; k < len; k++) {
      sibling = siblings[k];
      if (this.isElement(sibling)) {
        counter++;
        if (sibling === element) {
          return ":nth-child(" + counter + ")";
        }
      }
    }
  }
  return null;
};

CssSelectorGenerator.prototype.testSelector = function(element, selector) {
  var isUnique, result;
  isUnique = false;
  if ((selector !== null) && selector !== '') {
    result = element.ownerDocument.querySelectorAll(selector);
    if (result.length === 1 && result[0] === element) {
      isUnique = true;
    }
  }
  return isUnique;
};

CssSelectorGenerator.prototype.getAllSelectors = function(element) {
  return {
    t: this.getTagSelector(element),
    i: this.getIdSelector(element),
    c: this.getClassSelectors(element),
    a: this.getAttributeSelectors(element),
    n: this.getNthChildSelector(element)
  };
};

CssSelectorGenerator.prototype.testUniqueness = function(element, selector) {
  var foundElements, parent;
  parent = element.parentNode;
  foundElements = parent.querySelectorAll(selector);
  return foundElements.length === 1 && foundElements[0] === element;
};

/*eslint-disable no-shadow */
CssSelectorGenerator.prototype.testCombinations = function(element, items, tag) {
  var item, k, l, len, len1, ref, ref1;
  ref = this.getCombinations(items);
  for (k = 0, len = ref.length; k < len; k++) {
    item = ref[k];
    if (this.testUniqueness(element, item)) {
      return item;
    }
  }

  if (tag !== null) {
    ref1 = items.map(function(item) {
      return tag + item;
    });
    for (l = 0, len1 = ref1.length; l < len1; l++) {
      item = ref1[l];
      if (this.testUniqueness(element, item)) {
        return item;
      }
    }
  }

  return null;
};
/*eslint-enable no-shadow */

CssSelectorGenerator.prototype.getUniqueSelector = function(element) {
  var foundSelector, k, len, ref, selectorType, selectors;
  selectors = this.getAllSelectors(element);
  ref = this.options.selectors;
  for (k = 0, len = ref.length; k < len; k++) {
    selectorType = ref[k];
    switch (selectorType) {
    case 'id':
      if (selectors.i !== null) {
        return selectors.i;
      }
      break;
    case 'tag':
      if (selectors.t !== null) {
        if (this.testUniqueness(element, selectors.t)) {
          return selectors.t;
        }
      }
      break;
    case 'class':
      if ((selectors.c !== null) && selectors.c.length !== 0) {
        foundSelector = this.testCombinations(element, selectors.c, selectors.t);
        if (foundSelector) {
          return foundSelector;
        }
      }
      break;
    case 'attribute':
      if ((selectors.a !== null) && selectors.a.length !== 0) {
        foundSelector = this.testCombinations(element, selectors.a, selectors.t);
        if (foundSelector) {
          return foundSelector;
        }
      }
      break;
    case 'nthchild':
      if (selectors.n !== null) {
        return selectors.n;
      }
    }
  }
  return '*';
};

CssSelectorGenerator.prototype.getSelector = function(element) {
  var allSelectors, item, k, l, len, len1, parents, result, selector, selectors;
  allSelectors = [];
  parents = this.getParents(element);
  for (k = 0, len = parents.length; k < len; k++) {
    item = parents[k];
    selector = this.getUniqueSelector(item);
    if (selector !== null) {
      allSelectors.push(selector);
    }
  }
  selectors = [];
  for (l = 0, len1 = allSelectors.length; l < len1; l++) {
    item = allSelectors[l];
    selectors.unshift(item);
    result = selectors.join(' > ');
    if (this.testSelector(element, result)) {
      return result;
    }
  }
  return null;
};

CssSelectorGenerator.prototype.getCombinations = function(items) {
  var i, j, k, l, ref, ref1, result;
  if (items === null) {
    items = [];
  }
  result = [[]];
  for (i = k = 0, ref = items.length - 1; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
    for (j = l = 0, ref1 = result.length - 1; 0 <= ref1 ? l <= ref1 : l >= ref1; j = 0 <= ref1 ? ++l : --l) {
      result.push(result[j].concat(items[i]));
    }
  }
  result.shift();
  result = result.sort(function(a, b) {
    return a.length - b.length;
  });
  result = result.map(function(item) {
    return item.join('');
  });
  return result;
};
