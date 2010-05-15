if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {

  },

  initialize: function(element, options) {
    if (!Midas.version) throw ('Midas.Region requires Midas');

    this.element = $(element);
    if (!this.element || !Midas.agentIsCapable()) return;

    this.options = Object.extend(Object.clone(this.options), options);
    this.name = this.element.getAttribute('id');

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

