if (!Midas) var Midas = {};
Midas.Dialog = Class.create({
  version: 0.2,
  button: null,
  element: null,
  setupFunction: null,
  options: {
    url: null,
    configuration: null
  },

  initialize: function(button, name, toolbar, options) {
    if (!Midas.version) throw('Midas.Dialog requires Midas');

    this.button = button;
    this.name = name;
    this.toolbar = toolbar;

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
    this.setupObservers();
  },

  build: function() {
    this.element = new Element('div', {'class': 'midas-dialog', style: 'display:none'});
    this.toolbar.element.appendChild(this.element);
  },

  setupObservers: function() {
    Event.observe(window, 'resize', function() {
      this.position();
    }.bind(this));
    Event.observe(this.element, 'mousedown', function(event) {
      event.stop();
    });
    Event.observe(this.button, 'click', function() {
      if (!this.element || this.disabled()) return;
      if (this.visible()) this.hide();
      else this.show();
    }.bind(this));
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
    this.position();
    this.element.show();
  },

  hide: function() {
    if (this.contextClass) {
      this.element.removeClassName(this.contextClass);
      this.contextClass = null;
    }

    this.element.hide();
  },

  position: function(keepVisible) {
  },

  visible: function() {
    return (!this.element || this.element.getStyle('display') == 'block');
  },

  disabled: function() {
    return (this.button.hasClassName('disabled') || this.button.up('.disabled'));
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
        this.hide();
        alert('Midas was unable to load "' + this.options.url + '" for the "' + this.name + '" dialog');
      }.bind(this)
    });
  },

  execute: function(action, options, event) {
    Midas.fire('button', {action: this.name, event: event, toolbar: this.toolbar, options: options});
  },

  destroy: function() {
    if (this.element) this.element.remove();
    this.element = null;
  }
});
