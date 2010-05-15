if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  options: {

  },

  initialize: function(options) {
    if (!Midas.version) throw ('Midas.Toolbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);
  }

});