if (!Midas) var Midas = {};
Midas.Select = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-select loading', style: 'display:none;'});
    this.toolbar.element.appendChild(this.element);
  },

  show: function() {
    if (!this.loaded) {
      this.position(true);
      this.load(this.show.bind(this));
      return;
    }

    if (this.toolbar.activeRegion) {
      this.contextClass = this.toolbar.activeRegion.name;
      this.element.addClassName(this.contextClass);
    }    
    this.element.setStyle({width: 'auto', height: 'auto'});
    this.position(this.visible);
    this.visible = true;

//  should we pull the transition out into it's own method so that we don't have to copy the entire show method()?
    new Effect.Appear(this.element, {
      transition: Effect.Transitions.sinoidal,
      duration: .2,
      from: 0,
      to: .9
    });
  },

  hide: function() {
    if (this.contextClass) {
      this.element.removeClassName(this.contextClass);
      this.contextClass = null;
    }

    if (this.visible) {
      new Effect.Fade(this.element, {
        transition: Effect.Transitions.linear,
        duration: .2,
        from: .9,
        to: 0
      });
    } else {
      this.element.hide();
    }
    this.visible = false;
  },

  position: function(keepVisible) {
    if (!this.element) return;

    this.element.setStyle({top: 0, left: 0, display: 'block', visibility: 'hidden', height: 'auto'});
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
