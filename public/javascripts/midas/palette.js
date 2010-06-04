if (!Midas) var Midas = {};
Midas.Palette = Class.create({
  version: 0.2,
  button: null,
  element: null,
  options: {
    url: null,
    configuration: null
  },

  initialize: function(button, options) {
    if (!Midas.version) throw('Midas.Region requires Midas');

    this.button = button;
    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
    this.setupObservers();
  },

  build: function() {
    this.element = new Element('div', {'class': 'midas-palette', style: 'display:none;'});
    document.body.appendChild(this.element);
  },

  setupObservers: function() {
    Event.observe(window, 'resize', this.position.bind(this));
    Event.observe(this.button, 'click', function() {
      if (!this.element) return;
      if (this.visible()) this.hide();
      else this.show();
    }.bind(this));
  },

  show: function() {
    if (!this.loaded) {
      this.load(this.show.bind(this));
      return;
    }

    this.position();
    this.element.show();
  },

  hide: function() {
    this.element.hide();
  },

  position: function() {
    var keepVisible = this.visible();
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

  visible: function() {
    return this.element.getStyle('display') == 'block';
  },

  load: function(callback) {
    this.loaded = true;
    this.element.innerHTML = '<div style="width:150px;height:150px">some content here</div>';
    if (callback) callback();
  },

  destroy: function() {
    if (this.element) this.element.remove();
    this.element = null;
  }

});