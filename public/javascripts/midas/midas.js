var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put',
    configuration: null,
    useIframe: false // boolean true, or a string of the document to load
  },
  modes: [],
  contentWindow: window,
  actionsToHandle: ['save'],

  initialize: function(options, toolbarOptions, regionOptions, statusbarOptions) {
    options = options || {};
    if (!Midas.agentIsCapable()) throw('Midas requires a browser that has contentEditable features');
    if (options['useIframe'] && !window.isTop()) {
      Midas.trace('Midas will only instantiate in "top", when using an iframe');
      return;
    }
    
    Midas.registerInstance(this);

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.toolbarOptions = toolbarOptions || {};
    this.statusbarOptions = statusbarOptions || {};
    this.regionOptions = regionOptions || {};
    
    this.initializeInterface();        
  },

  initializeInterface: function() {
    this.regions = [];

    if (this.options['useIframe']) {
      var src = (this.options['useIframe'] === true) ? window.location.href + '?midas_regions=true' : this.options['useIframe'];

      this.iframe = new Element('iframe', {
        seamless: 'true',
        frameborder: '0',
        id: 'midas-iframe-window',
        src: 'about:blank'
      });

      Event.observe(this.iframe, 'load', function() {
        this.iframe.contentWindow.onbeforeunload = Midas.onBeforeUnload;
        this.initializeRegions(this.iframe.contentWindow);
        this.finalizeInterface();
        Midas.hijaxExternalLinks(this.iframe.contentWindow.document.body);
      }.bind(this));

      this.iframe.src = src;
      this.iframeContainer = new Element('div', {'class': 'midas-iframe-container'});      
      this.iframeContainer.appendChild(this.iframe);
      

      document.body.setStyle('overflow:hidden');
      document.body.appendChild(this.iframeContainer);
      
    } else {
      this.initializeRegions(this.contentWindow);
      window.onbeforeunload = Midas.onBeforeUnload;
      this.finalizeInterface();
    }
  },

  initializeRegions: function(contentWindow) {
    this.contentWindow = contentWindow;
    Object.extend(this.regionOptions, {contentWindow: this.contentWindow, configuration: this.options['configuration']});

    var body = this.contentWindow.document.body;
    if (typeof(body.select) == 'function') {
      this.regionElements = body.select('.' + this.options['classname']);
    } else {
      this.regionElements = body.getElementsByClassName(this.options['classname']);
    }

    for (var i = 0; i < this.regionElements.length; ++i) {
      this.regions.push(new Midas.Region(this.regionElements[i], this.regionOptions, 'midas' + this._id + '_region_' + i));
    }
  },

  finalizeInterface: function() {
    if (this.regions[0]) this.setActiveRegion(this.regions[0]);

    Object.extend(this.toolbarOptions, {contentWindow: this.contentWindow, configuration: this.options['configuration']});
    Object.extend(this.statusbarOptions, {contentWindow: this.contentWindow, configuration: this.options['configuration']});
    
    if (!this.toolbar && !this.statusbar) {
      this.toolbar = new Midas.Toolbar(this.toolbarOptions);
      this.statusbar = new Midas.Statusbar(this.statusbarOptions);
    }

    this.resize();

    this.setupObservers();
  },

  setupObservers: function() {
    Event.observe(window, 'resize', this.resize.bind(this));

    var observedDocuments = [document];
    if (this.iframe) observedDocuments.push(this.iframe.contentWindow.document);
    observedDocuments.each(function(doc) {
      Event.observe(doc, 'mouseup', function(e) {
        var element = Event.element(e);
        if (element != document) {
          if (this.toolbar && (element.descendantOf(this.toolbar.element) || element == this.toolbar.element)) return;
          if (this.statusbar && (element.descendantOf(this.statusbar.element) || element == this.statusbar.element)) return;

          for (var i = 0; i < this.regions.length; ++i) {
            if (element == this.regions[i].element || element.descendantOf(this.regions[i].element)) return;
          }
        }

        this.setActiveRegion(null);
        if (this.toolbar) this.toolbar.unsetActiveButtons();
      }.bind(this));
    }.bind(this));

    //{action: action, event: event, toolbar: this, options: {}}
    Event.observe(document, 'midas:button', function(e) {
      var a = e.memo;
      this.handleAction(a['action'], a['event'], a['toolbar'], a['options']);
    }.bindAsEventListener(this));
    
    //{action: action, options: {}}
    Event.observe(document, 'midas:action', function(e) {
      var a = e.memo;
      this.handleAction(a['action'], e, null, a['options']);
    }.bindAsEventListener(this));

    //{mode: mode, toolbar: this}
    Event.observe(document, 'midas:mode', function(e) {
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
    if (this.toolbar) this.toolbar.setActiveRegion(region);
  },

  handleAction: function(action, event, toolbar, options) {
    options = options || {};

    if (toolbar && this.toolbar != toolbar) return;

    if (this.actionsToHandle.indexOf(action) > -1) {
      if (Object.isFunction(this[action])) {
        var handled = this[action].apply(this, arguments);
        if (handled) return handled;
      }
    }
    if (!this.activeRegion) return;

    this.changed = true;
    
    this.activeRegion.handleAction(action, event, toolbar, options);

    if (this.statusbar) this.statusbar.update(this.activeRegion, event);
    if (this.toolbar) this.toolbar.setActiveButtons(this.regions, this.activeRegion);
  },

  handleMode: function(mode, toolbar) {
    this.modes[mode] = !this.modes[mode];
    switch(mode) {
      case 'preview':
        window.getSelection().removeAllRanges();
        this.toolbar.toggleDisabled('htmleditorbar', 'undoredo', 'insert', 'inspector');
        this.regions.each(function(region) {
          region.togglePreview();
        });
        break;
    }
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

  resize: function() {
    var view = document.viewport.getDimensions();

    if (this.iframe) {
      var offsetTop = (this.toolbar) ? this.toolbar.getBottomOffset() : 0;
      var statusbarHeight = (this.statusbar) ? this.statusbar.getHeight() : 0;
      this.iframeContainer.setStyle({
        height: (view.height - statusbarHeight - offsetTop - 10) + 'px',
        width: view.width + 'px',
        top: offsetTop + 'px',
        left: 0
      });
      this.iframe.setStyle({
        height: (view.height - statusbarHeight - offsetTop - 10) + 'px',
        width: view.width + 'px'
      });
    }
  },

  destroy: function() {
    if (this.toolbar) this.toolbar.destroy();
    if (this.statusbar) this.statusbar.destroy();
    this.regions.each(function(region) {
      region.destroy();
    });
    if (this.iframe) {
      document.body.setStyle('overflow:auto');
      this.iframeContainer.remove();
      this.iframe = null;
    }
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
  silentMode: false,

  registerInstance: function(instance) {
    this.instances.push(instance);
  },

  unregisterInstance: function(instance) {
    this.instances = this.instances.without(instance);
  },

  onBeforeUnload: function() {
    var prompt = false,
        message = "You have unsaved changes.  Are you sure you want to leave without saving them first?";
    for (var i = 0; i < Midas.instances.length; ++i) {
      if (Midas.instances[i].changed) {
        prompt = true;
        break;
      }
    }
    if (!Midas.silentMode && prompt) return message;
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
  
  hijaxExternalLinks: function(container) {
    links = container.select('a');    
    for (var a=0; a < links.length; a++) {
      uri = links[a].getAttribute('href');      
      if (uri.match(/^http:\/\//) && uri.split('://')[1].split('/')[0] != window.location.hostname) {
        if (links[a].target === '' || links[a].target == '_self' || links[a].target == '_parent') {
          links[a].writeAttribute('target', '_top');
        }        
        links[a].addClassName('external-link');
      }
    };
  },

  trace: function() {
    var args = [];
    for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
    if (Midas.debugMode && typeof(console) != 'undefined') {
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