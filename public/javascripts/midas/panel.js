if (!Midas) var Midas = {};
Midas.Panel = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-panel loading', style: 'display:none;'});
    this.element.update('<h3 class="title">' + this.options['title'] + '</h3><div class="midas-panel-pane"></div>');

    this.toolbar.element.appendChild(this.element);

    this.titleElement = this.element.down('h3.title');
    this.panelElement = this.element.down('div.midas-panel-pane');
  },

  position: function(keepVisible) {
    if (!this.element) return;

    this.element.setStyle({display: 'block', visibility: 'hidden', width: 'auto'});

    var top = this.toolbar.getBottomOffset();
    var height = document.viewport.getHeight() - top - 40;
    var position = this.element.cumulativeOffset();
    var elementWidth = this.element.getWidth();
    this.viewportWidth = document.viewport.getWidth();

    this.element.setStyle({
      top: (top + 8) + 'px',
      height: height + 'px',
      width: 'auto',
      display: keepVisible ? 'block' : 'none',
      visibility: 'visible'
    });

    if (!this.moved) {
      this.element.setStyle({left: (this.viewportWidth - elementWidth - 20) + 'px'}); 
    }

    if (this.pinned || elementWidth + position.left > this.viewportWidth) {
      this.element.setStyle({left: (this.viewportWidth - elementWidth - 20) + 'px'});
    }

    if (!this.draggable) {
      this.draggable = new Draggable(this.element, {
        handle: this.titleElement,
        constraint: 'horizontal',
        zindex: 10003,
        snap: function(x, y) {
          var elementWidth = this.element.getWidth();
          x = (x < 30) ? 10 : x;
          if (x > this.viewportWidth - (elementWidth + 40)) {
            x = this.viewportWidth - (elementWidth + 20);
            this.pinned = true;
            this.moved = true;
          } else {
            this.pinned = false;
          }
          return [x, y];
        }.bind(this)
      });
    }

    var paddingHeight = parseInt(this.panelElement.getStyle('padding-top')) + parseInt(this.panelElement.getStyle('padding-bottom'));
    var titleHeight = parseInt(this.titleElement.getStyle('padding-top')) + parseInt(this.titleElement.getStyle('padding-bottom')) + parseInt(this.titleElement.getStyle('height'));
    this.panelElement.setStyle({height: (height - paddingHeight - titleHeight) + 'px'});
  },

  load: function(callback) {
    new Ajax.Request(this.options.url, {
      method: 'get',
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.panelElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.setupFunction = window['midas_setup_' + this.name];
        if (this.setupFunction) this.setupFunction.call(this);

        if (callback) callback();
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + this.options.url + '" for the "' + this.name + '" select menu');
      }.bind(this)
    });
  },

  show: function($super) {
    this.toolbar.hidePanels();
    this.button.addClassName('pressed');

    $super();
  },

  hide: function($super) {
    this.button.removeClassName('pressed');
    
    $super();
  }

});