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
