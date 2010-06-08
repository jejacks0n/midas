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
  },

  load: function(callback) {
    new Ajax.Request(this.options.url, {
      method: 'get',
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.element.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.setupFunction = window['midas_setup_' + this.name];
        if (this.setupFunction) this.setupFunction.call(this);

        if (callback) callback();
      }.bind(this),
      onFailure: function() {
        alert('unable to get the url "' + this.options.url + '" for loading');
      }
    });
  }

});
