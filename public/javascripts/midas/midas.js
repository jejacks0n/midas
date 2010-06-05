var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put',
    configuration: null
  },
  actionsToHandle: ['save'],

  initialize: function(options, toolbarOptions, regionOptions, statusbarOptions) {
    if (!Midas.agentIsCapable()) throw('Midas requires a browser that has contentEditable features');

    Midas.registerInstance(this);

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];
    
    toolbarOptions = toolbarOptions || {};
    Object.extend(toolbarOptions, {configuration: this.options['configuration']});
    this.toolbar = new Midas.Toolbar(toolbarOptions);

    statusbarOptions = statusbarOptions || {};
    Object.extend(statusbarOptions, {configuration: this.options['configuration']});
    this.statusbar = new Midas.Statusbar(statusbarOptions);

    regionOptions = regionOptions || {};
    Object.extend(regionOptions, {configuration: this.options['configuration']});
    this.regions = [];
    this.regionElements = $$('div.' + this.options['classname']);
    var index = 0;
    this.regionElements.each(function(element) {
      this.regions.push(new Midas.Region(element, regionOptions, 'midas' + this._id + '_region_' + index));
      index++;
    }.bind(this));

    if (this.regions[0]) this.setActiveRegion(this.regions[0]);

    window.onbeforeunload = this.onBeforeUnload.bind(this);

    this.setupObservers();
  },

  onBeforeUnload: function() {
    if (this.changed) return "You've made changes without saving them.  Are you sure you'd like to navigate away without saving them first?";
  },

  setupObservers: function() {
    Event.observe(document, 'mouseup', function(e) {
      var element = Event.element(e);
      if (this.toolbar && (element.descendantOf(this.toolbar.element) || element == this.toolbar.element)) return;
      for (var i = 0; i < this.regions.length; ++i) {
        if (element == this.regions[i].element || element.descendantOf(this.regions[i].element)) return;
      }

      this.setActiveRegion(null);
      if (this.toolbar) this.toolbar.unsetActiveButtons();
    }.bind(this));

    //{action: action, event: event, toolbar: this}
    Event.observe(document, 'midas:button', function(e) {
      if (!this.activeRegion) return;
      var a = e.memo;

      if (this.toolbar != a['toolbar']) return;
      this.changed = true;

      var handled = this.handleAction(a['action'], a['event'], a['toolbar'], a['options']);
      if (!handled) this.activeRegion.handleAction(a['action'], a['event'], a['toolbar'], a['options']);
      if (this.statusbar) this.statusbar.update(this.activeRegion, e);
      if (this.toolbar) this.toolbar.setActiveButtons(this.regions, this.activeRegion);
    }.bindAsEventListener(this));

    //{mode: mode, toolbar: this}
    Event.observe(document, 'midas:mode', function(e) {
      if (!this.activeRegion) return;
      var a = e.memo;

      if (this.toolbar != a['toolbar']) return;

      this.handleMode(a['mode'], a['toolbar']);
    }.bindAsEventListener(this));

    //{region: this, name: this.name, event: event}
    Event.observe(document, 'midas:region', function(e) {
      var a = e.memo;
      if (this.regions.indexOf(a['region']) < 0) return;

      if (a['changed']) this.changed = true;
      this.setActiveRegion(a['region']);
    }.bindAsEventListener(this));

    //{region: this, name: this.name, event: event}
    Event.observe(document, 'midas:region:update', function(e) {
      var a = e.memo;

      Midas.fire('region', e.memo);

      if (this.regions.indexOf(a['region']) < 0) return;
      
      if (this.statusbar) this.statusbar.update(this.activeRegion, a['event']);
      if (this.toolbar) this.toolbar.setActiveButtons(this.regions, this.activeRegion);
    }.bind(this));
  },

  setActiveRegion: function(region) {
    this.activeRegion = region; 
  },

  handleAction: function(action, event, toolbar, options) {
    options = options || {};
    
    if (this.actionsToHandle.indexOf(action) < 0) return false;
    if (Object.isFunction(this[action])) return this[action].apply(this, arguments);

    throw('Unhandled action "' + action + '"');
  },

  handleMode: function(mode, toolbar) {
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
      parameters: Object.extend(parameters, this.serialize()),
      onSuccess: function() {
        this.changed = false;
      }.bind(this)
    });

    return true;
  },

  destroy: function() {
    this.toolbar.destroy();
    this.statusbar.destroy();
    this.regions.each(function(region) {
      region.destroy();
    });
    this.toolbar = null;
    this.statusbar = null;
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
    Midas.trace('Midas.fire', event, memo);

    Event.fire(document, event, memo);
  },

  trace: function() {
    var args = [];
    for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
    if (Midas.debugMode && console) {
      try {
        console.debug(args);
      } catch(e1) {
        try {
          console.info(args);
        } catch(e2) {
          try { console.log(args); } catch(e3) {}
        }
      }
    }
  }
});

