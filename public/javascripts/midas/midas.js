var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put',
    configuration: null
  },

  initialize: function(options, toolbarOptions, regionOptions) {
    if (!Midas.agentIsCapable()) throw('Midas requires a browser that has contentEditable features.');

    this.options = Object.extend(Object.clone(this.options), options);

    this.options.configuration = this.options.configuration || Midas.Config;
    this.toolbar = new Midas.Toolbar(toolbarOptions);

    this.regions = [];
    this.regionElements = $$('div.' + this.options['classname']);
    this.regionElements.each(function(element) {
      this.regions.push(new Midas.Region(element, regionOptions));
    }.bind(this));
  },

  serialize: function() {
    var serialized = {};
    this.regions.each(function(region) {
      var value = region.serialize();
      serialized[value.name] = value.content;
    });
    return serialized;
  },

  save: function() {
    var method = this.options.saveMethod;
    var parameters = {};
    if (method.toUpperCase() != 'POST' && method.toUpperCase() != 'GET') {
      parameters['_method'] = method;
    }

    new Ajax.Request(this.options.saveUrl, {
      method: method,
      parameters: Object.extend(parameters, this.serialize())
    });
  },

  destroy: function() {
    this.toolbar.destroy();
    this.regions.each(function(region) {
      region.destroy();
    });
  }
});

// Midas static methods
Object.extend(Midas, {
  version: 0.2,

  agent: function() {
    if (this.agentId) return this.agentId;

    var agent = navigator.userAgent.toLowerCase();

    var name = null;
    if ((agent.indexOf("msie") != -1) && (agent.indexOf("opera") == -1) && (agent.indexOf("webtv") == -1)) {
      name = 'msie';
    } else if (agent.indexOf("opera") != -1) {
      name = 'opera';
    } else if (agent.indexOf("gecko") != -1) {
      name = 'gecko';
    } else if (agent.indexOf("safari") != -1) {
      name = 'safari';
    } else if (agent.indexOf("konqueror") != -1) {
      name = 'konqueror';
    }

    this.agentId = name;
    return name;
  },

  agentIsCapable: function() {
    var agent = Midas.agent();

    // TODO: IE is disabled at this point because it doesn't follow the w3c standards in regards to designMode.
    return (agent && document.getElementById && document.designMode && agent != 'konqueror' && agent != 'msie') ? true : false;
  }
});

