if (!Midas) var Midas = {};
Midas.Panel = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-panel loading', style: 'display:none;'});
    this.element.update('<h3 class="title">' + this.options['title'] + '</h3><div class="midas-panel-pane"></div>');

    this.toolbar.element.appendChild(this.element);

    this.titleElement = this.element.down('h3.title');
    this.panelElement = this.element.down('div.midas-panel-pane');
    if (this.toolbar.config.preload['panels']) {
      this.load(function() {
        this.resize();
        this.hide();
      }.bind(this));
    }
  },

  setupObservers: function() {
    Event.observe(window, 'resize', function() {
      this.position(this.visible);
    }.bind(this));
    Event.observe(this.element, 'mousedown', function(e) {
      e.stop();
    });
    Event.observe(this.button, 'click', function() {
      if (!this.element || this.disabled()) return;
      if (this.visible) this.hide();
      else {
        this.toolbar.hidePanels();
        this.button.addClassName('pressed');
        this.show();
      }
    }.bind(this));
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

    if (!keepVisible) this.element.hide();
    this.panelElement.setStyle({height: (height - paddingHeight - titleHeight) + 'px'});
  },

  resize: function() {
    var oldWidth = this.panelElement.getWidth();
    this.panelElement.setStyle({width: 'auto'});
    var newWidth = this.panelElement.getWidth();
    this.panelElement.setStyle({width: oldWidth + 'px'});
    var position = this.element.cumulativeOffset();

    if (newWidth <= oldWidth) {
      this.panelElement.setStyle({visibility: 'visible', width: 'auto'});
      return;
    }

    new Effect.Parallel([
      new Effect.Morph(this.panelElement, { style: {width: newWidth + 'px'} }),
      new Effect.Morph(this.element, { style: {left: position.left - (newWidth - oldWidth) + 'px'} })
      ], {
      transition: Effect.Transitions.sinoidal,
      duration: .2,
      afterFinish: function() {
        this.panelElement.setStyle({visibility: 'visible', width: 'auto'});
      }.bind(this)
    });
  },

  load: function(callback) {
    Midas.loadView(this.options.url, {
      method: 'get',
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.panelElement.setStyle({visibility: 'hidden', width: this.panelElement.getWidth() + 'px'});
        this.panelElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.setupFunction = window['midas_setup_' + this.name];
        if (this.setupFunction) this.setupFunction.call(this);

        if (callback) callback();
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + this.options.url + '" for the "' + this.name + '" panel');
      }.bind(this)
    });
  },

  appear: function() {
    this.visible = true;
    new Effect.Appear(this.element, {
      transition: Effect.Transitions.sinoidal,
      duration: .2,
      to: .90,
      afterFinish: function() {
        if (!this.loaded) this.load(this.resize.bind(this));
      }.bind(this)
    });
  },

  hide: function($super) {
    this.button.removeClassName('pressed');
    $super();
  }

});