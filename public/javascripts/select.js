if (!Midas) var Midas = {};
Midas.Select = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-select loading', style: 'display:none;'});
    this.toolbar.element.appendChild(this.element);
    if (this.toolbar.config.preload['selects']) this.load();
  },

  position: function(keepVisible) {
    if (!this.element) return;

    this.element.setStyle({top: 0, left: 0, display: 'block', visibility: 'hidden'});
    var position = this.button.cumulativeOffset();
    var dimensions = this.element.getDimensions();
    var viewportDimensions = document.viewport.getDimensions();

    var top = (position.top + (this.button.getHeight() / 2) - (dimensions.height / 2));
    if (top < position.top - 100) top = position.top - 100;
    if (top < 20) top = 20;

    var height = 'auto';
    if (top + dimensions.height >= viewportDimensions.height - 20) {
      height = (viewportDimensions.height - top - 20);
    }

    if (position.left + dimensions.width > viewportDimensions.width) {
      position.left = position.left - dimensions.width + this.button.getWidth();
    }
    
    this.element.setStyle({
      top: top + 'px',
      left: position.left + 'px',
      height: height + 'px',
      display: keepVisible ? 'block' : 'none',
      visibility: 'visible'
    });
  }
});
