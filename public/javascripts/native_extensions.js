NodeList.prototype.equals = function(that) {
  var length = this.length;
  if (length != that.length) return false;

  var thisItem, thatItem, i;
  length = length - 1;
  for (i = 0; i <= length; ++i) {
    thisItem = this[i];
    thatItem = that.item(i);

    if (thisItem.nodeType != thatItem.nodeType || thisItem.nodeName != thatItem.nodeName) return false;
  }

  for (i = 0; i <= length; ++i) {
    thisItem = this.item(i);
    thatItem = that.item(i);

    if (thisItem.nodeType == 3) {
      if (thisItem.innerText != thatItem.innerText) return false;
    } else if (thisItem.innerHTML && thatItem.innerHTML) {
      if (thisItem.innerHTML != thatItem.innerHTML) return false;
    }
  }
  
  return true;
};

Number.prototype.toHex = function() {
  var result = this.toString(16).toUpperCase();
  return result[1] ? result : "0" + result;
};

String.prototype.toHex = function() {
  return this.replace(/rgb\((\d+)[\s|\,]?\s(\d+)[\s|\,]?\s(\d+)\)/gi,
    function (a, b, c, d) {
      return "#" + parseInt(b).toHex() + parseInt(c).toHex() + parseInt(d).toHex();
    }
  )
};

window.isTop = function() {
  return (this == top);
};

DocumentFragment.prototype.getTextNodes = function(element, textnodes) {
  element = element || this;
  textnodes = textnodes || [];

  Element.cleanWhitespace(element);

  for (var i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) {
      textnodes.push(element.childNodes[i]);
    } else {
      this.getTextNodes(element.childNodes[i], textnodes);
    }
  }

  return textnodes;
};

DocumentFragment.prototype.containsTags = function(tags, element) {
  element = element || this;

  var i;
  for (i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) continue;
    if (tags.indexOf(element.childNodes[i].tagName.toLowerCase()) > -1) {
      return true;
    }
  }

  for (i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) continue;
    if (this.containsTags(tags, element.childNodes[i])) {
      return true;
    }
  }

  return false;
};

String.prototype.singleDiff = function(that) {
  var diff = '';
  var thatLength = that.length;
  for (var i = 0; i < thatLength; ++i) {
    if (this[i] != that[i]) {
      var regExEscape = this.substr(i).regExEscape().replace(/^\s+|^(&nbsp;)+/g, '');
      var re = new RegExp(regExEscape + '$', 'm');
      diff = that.substr(i).replace(re, '');
      break;
    }
  }

  return diff;
};

String.prototype.regExEscape = function() {
  if (!arguments.callee.sRE) {
    var specials = ['/','.','*','+','?','|','(',')','[',']','{','}','\\'];
    arguments.callee.sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  }
  return this.replace(arguments.callee.sRE, '\\$1');
};
