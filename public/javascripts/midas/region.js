if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {
    configuration: null
  },

  initialize: function(element, options, index) {
    if (!Midas.version) throw('Midas.Region requires Midas');
    if (!Midas.agentIsCapable()) throw('Midas.Region requires a browser that has contentEditable features');

    this.element = $(element);
    if (!this.element) throw('Unable to locate that element');
    
    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.name = this.element.getAttribute('id') || 'midas_region_' + index;

    this.makeEditable();
  },

  makeEditable: function() {
    this.element.contentEditable = true;
  },

  setContents: function(content) {
    this.element.innerHTML = content;
  },

  getContents: function() {
    return this.element.innerHTML.replace(/^\s+|\s+$/g,"");
  },

  serialize: function() {
    return {name: this.name, content: this.getContents()}
  },

  destroy: function() {
    this.element.contentEditable = 'inherit';
  }
});

