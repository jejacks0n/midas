if (!Midas) var Midas = {};
Midas.modal = function(url, options) {
  var w = window.isTop() ? window : top;
  w.Midas.modal.show(url, options);
  return w.Midas.modal;
};

Object.extend(Midas.modal, {
  version: 0.2,
  initialized: false,
  animationDuration: .50,
  options: {
    title: ''
  },

  _initialize: function(options) {
    this._options = Object.clone(this.options);
    Object.extend(this._options, options || {});

    if (this.initialized) return false;

    this._build();
    this._setupObservers();
    this.initialized = true;
  },

  _build: function() {
		this.overlayElement = new Element('div', {id: 'midas_modal_overlay', style: 'display:none'});
		this.element = new Element('div', {id: 'midas_modal', style: 'display:none'});
    this.element.update('<form class="midas-modal-frame" id="midas_modal_form"><h1><span></span><a>&times;</a></h1><div class="midas-modal-content-container"><div class="midas-modal-content"></div></div></form>');

    this.frameElement = this.element.down('.midas-modal-frame');
    this.contentContainerElement = this.element.down('.midas-modal-content-container');
    this.contentElement = this.element.down('.midas-modal-content');

    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.element);
  },

  _setupObservers: function() {
    Event.observe(window, 'resize', this.position.bind(this));
    Event.observe(this.element.down('h1 a'), 'click', this.hide.bind(this));
    Event.observe(this.overlayElement, 'mousedown', function(e) { e.stop(); });
    Event.observe(this.overlayElement, 'mouseup', function(e) { e.stop(); });
    Event.observe(this.element, 'mouseup', function(e) { e.stop(); });
    Event.observe(this.element.down('h1'), 'mousedown', function(e) { e.stop(); });
    Event.observe(this.frameElement, 'submit', function(e) {
      if (window['midas_modal_submit']) window['midas_modal_submit'](e);
    });

    var documents = [document];
    var iframe = $('midas-iframe-window');
    if (iframe) documents.push(iframe.contentWindow.document);
    documents.each(function(doc) {
      Event.observe(doc, 'keydown', function(e) {
        if (this.showing && e.keyCode == 27) this.hide();
      }.bind(this));
    }.bind(this));
  },

  show: function(url, options) {
    this._initialize(options);

    this.contentElement.innerHTML = '';
    this.updateTitle();

    if (!this.showing) {
      this.fire('onShow');
      this.appear(url);
    } else {
      this.update(url);
    }
  },

  appear: function(url) {
    this.visible = true;
    new Effect.Appear(this.overlayElement, {
      transition: Effect.Transitions.sinoidal,
      duration: this.animationDuration / 2,
      to: .65,
      afterFinish: function() {
        this.element.show();
        var height = this.frameElement.getHeight();
        this.frameElement.setStyle({top: (-height) + 'px', visibility: 'visible'});
        new Effect.Morph(this.frameElement, {
          style: {top: '0px'}, 
          transition: Effect.Transitions.sinoidal,
          duration: this.animationDuration / 2,
          afterFinish: function() {
            this.showing = true;
            this.load(url);
          }.bind(this)
        });
      }.bind(this)
    });
  },

  update: function(url) {
    if (!this.initialized) throw("Midas.Modal cannot update before it's been initialized");

    this.load(url);
    this.fire('onUpdate');
  },

  hide: function(options) {
    if (!this.initialized) throw("Midas.Modal cannot hide before it's been initialized");

    if (options) {
      this._options = Object.clone(this.options);
      Object.extend(this._options, options);
    }

    this.fire('beforeHide');
    this.showing = false;

    this.element.hide();
    this.overlayElement.hide();

    this.element.setStyle({width: null});
    this.frameElement.setStyle({width: null});
    this.contentContainerElement.setStyle({height: null});
    this.contentElement.setStyle({height: null});

    if (this.controls) {
      this.controls.remove();
    }
  },

  updateTitle: function() {
    if (!this.initialized) throw("Midas.Modal cannot update the title before it's been initialized");

    var titleElement = this.element.down('h1 span');
    if (this._options['title']) {
      titleElement.show();
      titleElement.update(this._options['title'] || '&nbsp;');
    } else {
      titleElement.hide();
    }
  },

  load: function(url, options) {
    url = (Midas.debug ? url + '?' + Math.random() : url);
    if (options) {
      this._options = Object.clone(this.options);
      Object.extend(this._options, options);
    }

    this.element.addClassName('loading');

    new Ajax.Request(url, {
      method: this._options['method'] || 'get',
      parameters: this._options['parameters'] || {},
      onSuccess: function(transport) {
        var width = this.element.getWidth();
        this.element.setStyle({width: width + 'px'});
        this.frameElement.setStyle({width: width + 'px'});

        this.loaded = true;
        this.element.removeClassName('loading');
        this.contentElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();
        this.setupControls();

        this.resize();
        this.fire('afterLoad');
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + url + '" for the modal');
      }.bind(this)
    });
  },

  position: function() {
    if (!this.element || !this.showing) return;
    
    this.frameElement.setStyle('width:auto');
    this.contentElement.setStyle('height:auto');
    this.contentContainerElement.setStyle('height:auto');

    this.frameElement.setStyle({display: 'block'});

    var dimensions = this.frameElement.getDimensions();

    this.element.setStyle({width: dimensions.width + 'px'});
    this.frameElement.setStyle({width: dimensions.width + 'px'});

    var viewportDimensions = document.viewport.getDimensions();
    if (dimensions.height >= viewportDimensions.height - 15 || this._options['fullHeight']) {
      var titleHeight = this.element.down('h1').getHeight();
      var controlsHeight = this.controls ? this.controls.offsetHeight : 0;
      this.contentContainerElement.setStyle({height: (viewportDimensions.height - titleHeight - controlsHeight - 20) + 'px'});
      this.contentElement.setStyle({height: (viewportDimensions.height - titleHeight - controlsHeight - 60) + 'px'});
    }
  },

  resize: function(keepHeight) {
    if (!this.element) return;

    this.contentContainerElement.setStyle('width:auto;position:absolute;overflow:hidden');
    var dimensions = this.contentContainerElement.getDimensions();
    var controlsHeight = this.controls ? this.controls.offsetHeight : 0;

    if (!keepHeight) this.contentContainerElement.setStyle({height: (25 - (controlsHeight - 30)) + 'px'});
    this.contentContainerElement.setStyle('position:static');

    this.contentElement.setStyle('height:auto;width:auto;visibility:hidden');
    var height = this.contentElement.getHeight() + 30;

    var viewportDimensions = document.viewport.getDimensions();
    var titleHeight = this.element.down('h1').getHeight();
    if (height + titleHeight + controlsHeight >= viewportDimensions.height - 20 || this._options['fullHeight']) {
      height = (viewportDimensions.height - titleHeight - controlsHeight - 20);
    }

    var duration = this.animationDuration;
    if ((keepHeight || this.contentContainerElement.getHeight() == height) && this.frameElement.getWidth() == dimensions.width) {
      duration = .1;
    }
    new Effect.Parallel([
      new Effect.Morph(this.contentContainerElement, {style: {height: height + 'px'}, sync: true}),
      new Effect.Morph(this.element, {style: {width: dimensions.width + 'px'}, sync: true}),
      new Effect.Morph(this.frameElement, {style: {width: dimensions.width + 'px'}, sync: true})
      ], {
      transition: Effect.Transitions.sinoidal,
      duration: duration,
      afterFinish: function() {
        this.contentContainerElement.setStyle('overflow:auto');
        this.contentElement.setStyle({display: 'none', visibility: 'visible', height: (height - 30) + 'px'});
        new Effect.Appear(this.contentElement, {
          transition: Effect.Transitions.sinoidal,
          duration: this.animationDuration / 2
        })
      }.bind(this)
    });
  },

  setupControls: function() {
    this.controls = this.contentElement.down('.midas-modal-controls');
    if (this.controls) {
      this.frameElement.appendChild(this.controls);
    }

    this.paneIndex = 0;
    this.panes = this.frameElement.select('.midas-modal-pane');
    if (this.panes.length > 1) {
      if (!this.controls) {
        this.controls = new Element('div', {'class': 'midas-modal-controls'});
        this.frameElement.appendChild(this.controls);
      }

      this.prevButton = new Element('input', {type: 'button', value: 'Previous', disabled: 'disabled'});
      this.nextButton = new Element('input', {type: 'button', value: 'Next'});

      this.prevButton.observe('click', this.prevPane.bind(this));
      this.nextButton.observe('click', this.nextPane.bind(this));

      this.controls.insert({top: this.prevButton});
      this.prevButton.insert({after: this.nextButton});

      this.showPane(0);
    }
  },

  prevPane: function() {
    this.showPane(this.paneIndex - 1);
  },

  nextPane: function() {
    this.showPane(this.paneIndex + 1);
  },

  showPane: function(index) {
    this.paneIndex = index;
    if (this.paneIndex <= 0) {
      this.paneIndex = 0;
      this.prevButton.disable();
    } else {
      this.prevButton.enable();
    }

    if (this.paneIndex >= this.panes.length - 1) {
      this.paneIndex = (this.panes.length - 1);
      this.nextButton.disable();
    } else {
      this.nextButton.enable();
    }

    this.panes.each(function(pane) {
      pane.setStyle('display:none');
    });

    this.panes[this.paneIndex].setStyle('display:block');
    this.resize(true);
  },

  fire: function(eventName) {
    var r = true;
    if (this._options[eventName]) {
      var returnValue = this._options[eventName].call(this);
      if (!Object.isUndefined(returnValue)) r = returnValue;
      this._options[eventName] = null;
    }
    Midas.fire('modal:' + eventName);
    return r;
  },

  destroy: function() {
    this.overlayElement.remove();
    this.element.remove();

    this.overlayElement = null;
    this.element = null;
    this.contentElement = null;
    this.initialized = false;
  }
});
