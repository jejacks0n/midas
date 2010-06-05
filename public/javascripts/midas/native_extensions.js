NodeList.prototype.equals = function(that) {
  var length = this.length;
  if (length != that.length) return false;

  var thisItem, thatItem;
  length = length - 1;
  for (var i = 0; i <= length; ++i) {
    thisItem = this[i];
    thatItem = that.item(i);

    if (thisItem.nodeType != thatItem.nodeType || thisItem.nodeName != thatItem.nodeName) return false;
  }

  for (var i = 0; i <= length; ++i) {
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