var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put',
    configuration: null
  },
  commandsToHandle: ['save'],

  initialize: function(options, toolbarOptions, regionOptions) {
    if (!Midas.agentIsCapable()) throw('Midas requires a browser that has contentEditable features');

    Midas.registerInstance(this);

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;

    toolbarOptions = toolbarOptions || {};
    Object.extend(toolbarOptions, {configuration: this.options['configuration']});
    this.toolbar = new Midas.Toolbar(toolbarOptions);

    regionOptions = regionOptions || {};
    Object.extend(regionOptions, {configuration: this.options['configuration']});
    this.regions = [];
    this.regionElements = $$('div.' + this.options['classname']);
    var index = 0;
    this.regionElements.each(function(element) {
      this.regions.push(new Midas.Region(element, regionOptions, 'midas_region_' + index));
      index++;
    }.bind(this));

    this.activeRegion = this.regions[0] ? this.regions[0] : null;

    this.setupObservers();
  },

  setupObservers: function() {
    Event.observe(document, 'midas:button', function(e) {
      var a = e.memo;
      //{toolbar: this, name: name, spec: buttonSpec, event: event}

      var handled = this.handleCommand.call(this, a['name'], a['spec'], a['event'], a['toolbar']);
      if (!handled) this.activeRegion.handleCommand.call(this, a['name'], a['spec'], a['event'], a['toolbar']);
    }.bind(this));

    Event.observe(document, 'midas:region', function(e) {
      var a = e.memo;
      //{region: this, name: this.name, event: event}

      this.setActiveRegion(a['region']);
    }.bind(this));

    Event.observe(document, 'midas:mode', function(e) {
      var a = e.memo;
      //{mode: mode}

      this.handleMode(a['mode']);
    }.bind(this));
  },

  setActiveRegion: function(region) {
    this.activeRegion = region; 
  },

  handleCommand: function(action, spec, event, toolbar) {
    if (this.commandsToHandle.indexOf(action) < 0) return false;
    if (Object.isFunction(this[action])) return this[action].apply(this, arguments);

    throw('Unhandled action "' + action + '"');
  },

  handleMode: function(mode) {
    //!!
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
    this.toolbar = null;
    this.regions = [];
    Midas.unregisterInstance(this);
  }
});

// Midas static methods
Object.extend(Midas, {
  version: 0.2,
  instances: [],
  agentId: null,
  debugMode: false,

  registerInstance: function(instance) {
    this.instances.push(instance);
  },

  unregisterInstance: function(instance) {
    this.instances = this.instances.without(instance);
  },

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
  },

  fire: function(event, memo) {
    event = 'midas:' + event;
    if (Midas.debugMode && console && console.info) {
      console.info(['Midas.fire', event, memo]);
    }
    Event.fire(document, event, memo);
  }
});

