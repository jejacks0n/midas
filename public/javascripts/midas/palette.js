if (!Midas) var Midas = {};
Midas.Palette = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-palette loading', style: 'display:none;'});
    this.toolbar.element.appendChild(this.element);
  },

  position: function(keepVisible) {
    if (!this.element) return;
    
    keepVisible = keepVisible || this.visible();
    this.element.setStyle({top: 0, left: 0, display: 'block', visibility: 'hidden'});
    var position = this.button.cumulativeOffset();
    var dimensions = this.element.getDimensions();
    if (position.left + dimensions.width > document.viewport.getWidth()) {
      position.left = position.left - dimensions.width + this.button.getWidth();
    }
    
    this.element.setStyle({
      top: (position.top + this.button.getHeight()) + 'px',
      left: position.left + 'px',
      display: keepVisible ? 'block' : 'none',
      visibility: 'visible'
    });
  }
});