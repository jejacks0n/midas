if (!Midas) var Midas = {};
Midas.modal = function(url, options) {
  var w = window.isTop() ? window : top;
  w.Midas.modal.show(url, options);
  return w.Midas.modal;
};

Object.extend(Midas.modal, {
  version: 0.2,
  initialized: false,
  options: {
    title: ''
  },

  _initialize: function(options) {
    Object.extend(this.options, options || {});

    if (this.initialized) return false;

    this._build();
    this._setupObservers();
    this.initialized = true;
  },

  _build: function() {
		this.overlayElement = new Element('div', {id: 'midas_modal_overlay', style: 'display:none'});
		this.element = new Element('div', {id: 'midas_modal', style: 'display:none'});
    this.element.update('<div class="midas-modal-frame"><h1><span></span><a>&times;</a></h1><div class="midas-modal-content-container"><div class="midas-modal-content"></div></div></div>');

    this.frameElement = this.element.down('.midas-modal-frame');
    this.contentContainerElement = this.element.down('.midas-modal-content-container');
    this.contentElement = this.element.down('.midas-modal-content');

    document.body.appendChild(this.overlayElement);
    document.body.appendChild(this.element);
  },

  _setupObservers: function() {
    Event.observe(window, 'resize', this.position.bind(this));
    Event.observe(this.element.down('h1 a'), 'click', this.hide.bind(this));
    Event.observe(this.overlayElement, 'mousedown', function(event) { event.stop(); });

    var documents = [document];
    var iframe = $$('iframe.midas-iframe-window')[0];
    if (iframe) documents.push(iframe.contentWindow.document);
    documents.each(function(doc) {
      Event.observe(doc, 'keydown', function(e) {
        if (this.showing && e.keyCode == 27) this.hide();
      }.bind(this));
    }.bind(this));
  },

  show: function(url, options) {
    this._initialize(options);

    this.load(url);
    this.updateTitle();

		if (!this.showing) {
      this.showing = true;
      this.overlayElement.show();
      this.element.show();
			this.fire('onShow');
		} else {
			this.update();
		}
  },

  update: function() {
    if (!this.initialized) throw("Midas.Modal cannot update before it's been initialized");

    this.fire('onUpdate');
  },

  hide: function(options) {
    if (!this.initialized) throw("Midas.Modal cannot hide before it's been initialized");

    Object.extend(this.options, options);

    this.fire('beforeHide');
    this.showing = false;

    this.element.hide();
    this.overlayElement.hide();

    if (this.controls) {
      this.controls.remove();
    }
  },

  updateTitle: function() {
    if (!this.initialized) throw("Midas.Modal cannot update the title before it's been initialized");

    var titleElement = this.element.down('h1 span');
    if (this.options['title']) {
      titleElement.show();
      titleElement.update(this.options['title']);
    } else {
      titleElement.hide();
    }
  },

  load: function(url, options) {
    Object.extend(this.options, options);

    this.element.addClassName('loading');

    new Ajax.Request(url, {
      method: this.options['method'] || 'get',
      parameters: this.options['parameters'] || {},
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.contentElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.controls = this.contentElement.down('.midas-modal-controls');
        if (this.controls) {
          this.frameElement.appendChild(this.controls);
        }

        this.position();
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + url + '" for the modal');
      }.bind(this)
    });
  },

  position: function() {
    this.frameElement.setStyle('width:auto');
    this.contentElement.setStyle('height:auto');
    this.contentContainerElement.setStyle('height:auto');

    var dimensions = this.frameElement.getDimensions();

    this.element.setStyle({width: dimensions.width + 'px'});
    this.frameElement.setStyle({width: dimensions.width + 'px'});

    var viewportDimensions = document.viewport.getDimensions();
    if (dimensions.height >= viewportDimensions.height - 20) {
      var titleHeight = this.element.down('h1').getHeight();
      this.contentContainerElement.setStyle({height: (viewportDimensions.height - titleHeight - 20) + 'px'})
    }
  },

  fire: function(eventName) {
    var r = true;
    if (this.options[eventName]) {
      var returnValue = this.options[eventName].call(this);
      if (!Object.isUndefined(returnValue)) r = returnValue;
      this.options[eventName] = null;
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
