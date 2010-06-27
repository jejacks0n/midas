NodeList.prototype.equals = function(that) {
  var length = this.length;
  if (length != that.length) return false;

  var thisItem, thatItem, i;
  length = length - 1;
  for (i = 0; i <= length; ++i) {
    thisItem = this[i];
    thatItem = that.item(i);

    if (thisItem.nodeType != thatItem.nodeType || thisItem.nodeName != thatItem.nodeName) return false;
  }

  for (i = 0; i <= length; ++i) {
    thisItem = this.item(i);
    thatItem = that.item(i);

    if (thisItem.nodeType == 3) {
      if (thisItem.innerText != thatItem.innerText) return false;
    } else if (thisItem.innerHTML && thatItem.innerHTML) {
      if (thisItem.innerHTML != thatItem.innerHTML) return false;
    }
  }
  
  return true;
};

Number.prototype.toHex = function() {
  var result = this.toString(16).toUpperCase();
  return result[1] ? result : "0" + result;
};

String.prototype.toHex = function() {
  return this.replace(/rgb\((\d+)[\s|\,]?\s(\d+)[\s|\,]?\s(\d+)\)/gi,
    function (a, b, c, d) {
      return "#" + parseInt(b).toHex() + parseInt(c).toHex() + parseInt(d).toHex();
    }
  )
};

window.isTop = function() {
  return (this == top);
};

DocumentFragment.prototype.getTextNodes = function(element, textnodes) {
  element = element || this;
  textnodes = textnodes || [];

  Element.cleanWhitespace(element);

  for (var i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) {
      textnodes.push(element.childNodes[i]);
    } else {
      this.getTextNodes(element.childNodes[i], textnodes);
    }
  }

  return textnodes;
};

DocumentFragment.prototype.containsTags = function(tags, element) {
  element = element || this;

  var i;
  for (i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) continue;
    if (tags.indexOf(element.childNodes[i].tagName.toLowerCase()) > -1) {
      return true;
    }
  }

  for (i = 0; i <= element.childNodes.length - 1; ++i) {
    if (element.childNodes[i].nodeType == 3) continue;
    if (this.containsTags(tags, element.childNodes[i])) {
      return true;
    }
  }

  return false;
};

String.prototype.singleDiff = function(that) {
  var diff = '';
  var thatLength = that.length;
  for (var i = 0; i < thatLength; ++i) {
    if (this[i] != that[i]) {
      var regExEscape = this.substr(i).regExEscape().replace(/^\s+|^(&nbsp;)+/g, '');
      var re = new RegExp(regExEscape + '$', 'm');
      diff = that.substr(i).replace(re, '');
      break;
    }
  }

  return diff;
};

String.prototype.regExEscape = function() {
  if (!arguments.callee.sRE) {
    var specials = ['/','.','*','+','?','|','(',')','[',']','{','}','\\'];
    arguments.callee.sRE = new RegExp('(\\' + specials.join('|\\') + ')', 'g');
  }
  return this.replace(arguments.callee.sRE, '\\$1');
};
var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put',
    configuration: null,
    useIframe: false // boolean true, or a string of the document to load
  },
  modes: {},
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
        this.initializeRegions(this.iframe.contentWindow);
        this.finalizeInterface();
        this.resetModes();

        Midas.hijackLinks(this.iframe.contentWindow.document.body);
        // doesn't work in webkit
        this.iframe.contentWindow.onbeforeunload = Midas.onBeforeUnload;
      }.bind(this));

      this.iframe.src = src;
      this.iframeContainer = new Element('div', {'class': 'midas-iframe-container'});      
      this.iframeContainer.appendChild(this.iframe);

      document.body.setStyle('overflow:hidden');
      document.body.appendChild(this.iframeContainer);
    } else {
      this.initializeRegions(this.contentWindow);
      this.finalizeInterface();

      Midas.hijackLinks(document.body);
      window.onbeforeunload = Midas.onBeforeUnload;
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

    this.regions = [];
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
      this.setupObservers();
    } else {
      if (this.toolbar) this.toolbar.reinitializeObservers();
    }

    this.resize();
  },

  setupObservers: function() {
    this.__mouseup = function(e) {
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
    }.bind(this);

    //memo: {action: action, event: event, toolbar: this, options: {}}
    this.__midasButton = function(e) {
      var a = e.memo;
      this.handleAction(a['action'], a['event'], a['toolbar'], a['options']);
    }.bind(this);

    //memo: {action: action, options: {}}
    this.__midasAction = function(e) {
      var a = e.memo;
      this.handleAction(a['action'], e, null, a['options']);
    }.bind(this);

    //memo: {mode: mode, toolbar: this}
    this.__midasMode = function(e) {
      var a = e.memo;
      if (this.toolbar != a['toolbar']) return;

      this.handleMode(a['mode'], a['toolbar']);
    }.bind(this);

    //memo: {region: this, name: this.name, event: event}
    this.__midasRegion = function(e) {
      var a = e.memo;
      if (this.regions.indexOf(a['region']) < 0) return;

      if (a['changed']) this.changed = true;
      this.setActiveRegion(a['region']);
    }.bind(this);

    //memo: {region: this, name: this.name, event: event}
    this.__midasRegionUpdate = function(e) {
      var a = e.memo;

      Midas.fire('region', e.memo);

      if (this.regions.indexOf(a['region']) < 0) return;

      if (this.statusbar) this.statusbar.update(this.activeRegion, a['event']);
      if (this.toolbar) this.toolbar.setActiveButtons(this.regions, this.activeRegion);
    }.bind(this);

    Event.observe(window, 'resize', this.resize.bind(this));
    var observedDocuments = [document];
    if (this.iframe) observedDocuments.push(this.iframe.contentWindow.document);
    observedDocuments.each(function(doc) {
      Event.observe(doc, 'mouseup', this.__mouseup);
    }.bind(this));

    Event.observe(document, 'midas:button', this.__midasButton);
    Event.observe(document, 'midas:action', this.__midasAction);
    Event.observe(document, 'midas:mode', this.__midasMode);
    Event.observe(document, 'midas:region', this.__midasRegion);
    Event.observe(document, 'midas:region:update', this.__midasRegionUpdate);
  },

  removeObservers: function() {
    Event.stopObserving(window, 'resize', this.resize.bind(this));
    var observedDocuments = [document];
    if (this.iframe) observedDocuments.push(this.iframe.contentWindow.document);
    observedDocuments.each(function(doc) {
      Event.stopObserving(doc, 'mouseup', this.__mouseup);
    }.bind(this));

    Event.stopObserving(document, 'midas:button', this.__midasButton);
    Event.stopObserving(document, 'midas:action', this.__midasAction);
    Event.stopObserving(document, 'midas:mode', this.__midasMode);
    Event.stopObserving(document, 'midas:region', this.__midasRegion);
    Event.stopObserving(document, 'midas:region:update', this.__midasRegionUpdate);
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

  handleMode: function(mode, toolbar, reset) {
    this.modes[mode] = this.modes[mode] ? false : true;
    switch(mode) {
      case 'preview':
        window.getSelection().removeAllRanges();
        if (this.iframe) this.iframe.contentWindow.getSelection().removeAllRanges();
        toolbar.toggleDisabled('htmleditorbar', 'undoredo', 'insert', 'inspector');
        if (reset) {
          toolbar.buttons['preview'].element.removeClassName('pressed');
          break;
        }
        this.regions.each(function(region) {
          region.togglePreview();
        });
        break;
    }
  },

  resetModes: function() {
    for (var i in this.modes) {
      console.debug(i, this.modes[i]);
      if (this.modes[i]) {
        this.handleMode(i, this.toolbar, true);
      }
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
    this.removeObservers();

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
  debug: false,
  silent: false,

  registerInstance: function(instance) {
    this.instances.push(instance);
  },

  unregisterInstance: function(instance) {
    this.instances = this.instances.without(instance);
  },

  onBeforeUnload: function() {
    var prompt = false, message = "You have unsaved changes.  Are you sure you want to leave without saving them first?";
    for (var i = 0; i < Midas.instances.length; ++i) {
      if (Midas.instances[i].changed) {
        prompt = true;
        break;
      }
    }
    if (!Midas.silent && prompt) return message;
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

  hijackLinks: function(element) {
    var links = Element.select(element, 'a');

    for (var i = 0; i < links.length; ++i) {
      var uri = links[i].getAttribute('href');
      var host = uri.match(/^[http:|https:]/) ? uri.split('://')[1].split('/')[0] : false;
      if (host &&
          host != window.location.host &&
          host != window.location.hostname &&
          ((links[i].target == '' || links[i].target == '_self')) &&
          !links[i].up('.midas-region')) {
        links[i].writeAttribute('target', '_top');
      }
    }
  },

  fire: function(event, memo) {
    event = 'midas:' + event;
    Midas.trace('Midas.fire', event, memo);

    Event.fire(document, event, memo);
  },
  
  trace: function() {
    var args = [];
    for (var i = 0; i < arguments.length; ++i) args.push(arguments[i]);
    if (Midas.debug && typeof(console) != 'undefined') {
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
if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {
    configuration: null,
    contentWindow: window,
    inline: false
  },
  previewing: false,

  initialize: function(element, options, name) {
    if (!Midas.version) throw('Midas.Region requires Midas');
    if (!Midas.agentIsCapable()) throw('Midas.Region requires a browser that has contentEditable features');

    this.element = $(element);
    if (!this.element) throw('Unable to locate the element "' + element + '"');
    this.sibling = this.element.previousSibling;

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];
    this.name = this.element.getAttribute('id') || name;
    this.doc = this.options['contentWindow'].document;
    this.selections = [];

    this.makeEditable();
    this.setupObservers();
  },

  makeEditable: function() {
    this.element.addClassName('midas-region');

    if (this.element.innerHTML.replace(/^\s+|\s+$/g, "") == '' && Prototype.Browser.Gecko) {
      this.setContents('&nbsp;')
    }
    
    if (this.options['inline']) {
      this.element.setStyle({height: 'auto', minHeight: '20px', minWidth: '20px'});
    } else {
      this.element.setStyle({overflow: 'auto'});
      var width = this.element.getWidth();
      if (width) this.element.setStyle({maxWidth: width + 'px'});
    }
    this.element.contentEditable = true;

    this.doc.execCommand('styleWithCSS', false, false);
    //this.doc.execCommand('enableInlineTableEditing', false, false);
  },

  setupObservers: function() {
    Event.observe(document, 'mouseup', function() {
      if (!this.selecting) return;
      this.selecting = false;
      this.updateSelections();
    }.bind(this));

    Event.observe(this.element, 'focus', function(e) {
      if (this.previewing) return;
      Midas.fire('region', {region: this, name: this.name, event: e});
      if (this.getContents() == '&nbsp;' && Prototype.Browser.Gecko) this.setContents('&nbsp;');
    }.bind(this));
    
    Event.observe(this.element, 'paste', function(e) {
      if (Midas.modal.showing) e.stop();
      var html = this.element.innerHTML;
      setTimeout(function() { this.afterPaste(html); }.bind(this), 1);
    }.bind(this));
    Event.observe(this.element, 'drop', function(e) {
      var html = this.element.innerHTML;
      setTimeout(function() { this.afterPaste(html); }.bind(this), 1);
    }.bind(this));

    Event.observe(this.element, 'mousedown', function() {
      this.selecting = true;
    }.bind(this));
    Event.observe(this.element, 'mouseup', function(e) {
      if (this.previewing) return;
      Midas.fire('region:update', {region: this, name: this.name, event: e});
    }.bind(this));
    Event.observe(this.element, 'click', function(e) {
      if (this.previewing) {
        var element = e.target;
        if (element.tagName == 'A') {
          var uri = element.getAttribute('href');
          var host = uri.match(/^[http:|https:]/) ? uri.split('://')[1].split('/')[0] : false;
          if (host && host != top.location.host && host != top.location.hostname) {
            this.options['contentWindow'].onbeforeunload = Midas.onBeforeUnload;
            top.location.href = uri;
            e.stop();
          }
        }
      } else {
        Midas.fire('region', {region: this, name: this.name, event: e});
        if (this.getContents() == '&nbsp;' && Prototype.Browser.Gecko) this.setContents('&nbsp;');
      }
    }.bind(this));

    Event.observe(this.element, 'keydown', function(e) {
      if (Midas.modal.showing && e.keyCode != 27) e.stop();
    }.bind(this));
    Event.observe(this.element, 'keyup', function(e) {
      if (this.previewing) return;
      this.updateSelections();
      Midas.fire('region:update', {region: this, name: this.name, event: e, changed: true});
    }.bind(this));
    Event.observe(this.element, 'keypress', function(e) {
      if (this.previewing) return;
      Midas.fire('region:update', {region: this, name: this.name, event: e});

      switch (e.keyCode) {
        case 9: // tab
          this.selections.each(function(selection) {
            var container = selection.commonAncestorContainer;
            if (container.nodeType == 3) container = container.parentNode;
            if (container.tagName == 'LI' || container.up('li')) {
              e.stop();
              this.handleAction('indent');
            }
          }.bind(this));
          break;
        case 13: // enter
          break;
      }
    }.bind(this));
  },

  setContents: function(content) {
    this.element.innerHTML = content;
  },

  getContents: function() {
    return this.element.innerHTML.replace(/^\s+|\s+$/g, "");
  },

  updateSelections: function() {
    var selection = this.options['contentWindow'].getSelection();
    this.selections = [];

    for (var i = 0; i <= selection.rangeCount - 1; ++i) {
      var range = selection.getRangeAt(i);

      if (range.commonAncestorContainer == this.element ||
          Element.descendantOf(range.commonAncestorContainer, this.element)) {
        this.selections.push(range);
      }
    }
  },

  afterPaste: function(beforeHtml) {
    var pastedRegion = this.element.down('.midas-region');
    if (pastedRegion) {
      var selection = this.options['contentWindow'].getSelection();
      selection.removeAllRanges();

      var range = this.doc.createRange();
      range.selectNode(pastedRegion);
      selection.addRange(range);

      this.execCommand('undo', null);
      this.execCommand('insertHTML', pastedRegion.innerHTML);
    }

    var pastedFromWord = this.element.innerHTML.indexOf('<!--StartFragment-->') > -1 || this.element.innerHTML.indexOf('="mso-') > -1 || this.element.innerHTML.indexOf('<o:') > -1;
    if (pastedFromWord) {
      var pasted = beforeHtml.singleDiff(this.element.innerHTML);
      var cleaned = this.sanitizeHtml(pasted);
      try {
        this.doc.execCommand('undo', false, null);
        this.execCommand('insertHTML', cleaned);
      } catch(e) {
        this.setContents(beforeHtml);
        Midas.modal('/midas/sanitizer.html', {
          title: 'HTML Sanitizer',
          afterLoad: function() {
            $('midas_sanitized_content').value = cleaned.replace(/<br\/>/g, '\n');
          }
        });
      }
    }
  },

  sanitizeHtml: function(html) {
    var temp = new Element('div').update(html);
    temp.select('style').each(function(style) {
      style.remove();
    });

    return temp.textContent.replace(/\n\n/g, '<br/>').
                            replace(/.*<!--.*-->/g, '').
                            replace(/^(<br\/>)+|(<br\/>\s*)+$/g, '');
  },

  execCommand: function(action, argument) {
    argument = typeof(argument) == 'undefined' ? null : argument;
    
    var supported = this.doc.execCommand('styleWithCSS', false, false);
    var handled;
    try {
      handled = this.doc.execCommand(action, false, argument);
    } catch(e) {
      Midas.trace(e);
      // Gecko does some interesting things when it fails on indent
      if (action == 'indent') {
        var sibling = this.element.previousSibling;
        if (sibling != this.sibling) sibling.remove();
      }
      handled = true;
    }
    if (!handled && supported) throw('Unknown action "' + action + '"');
  },

  serialize: function() {
    return {name: this.name, content: this.getContents()}
  },

  togglePreview: function() {
    if (this.previewing) {
      this.element.removeClassName('midas-region-preview');
      this.makeEditable();
      this.previewing = false;
    } else {
      this.element.contentEditable = false;
      this.element.addClassName('midas-region-preview');
      this.element.setStyle({height: null, minHeight: null, minWidth: null, maxWidth: null, overflow: null});
      this.element.removeClassName('midas-region');
      this.previewing = true;
    }
  },

  destroy: function() {
    this.element.contentEditable = 'false';
    this.element.blur();
    this.element.removeClassName('midas-region');
  },

  handleAction: function(action, event, toolbar, options) {
    options = options || {};
    
    if (this.config['behaviors'][action]) {
      var behaviors = this.config['behaviors'][action];

      for (var behavior in behaviors) {
        if (Object.isFunction(this.handle[behavior])) {
          this.handle[behavior].call(this, action, toolbar, options, behaviors[behavior]);

          var sel = window.getSelection();
          this.selections.each(function(selection) {
            //sel.removeRange(selection);
            sel.addRange(selection);
          })
        } else {
          throw('Unknown behavior method "' + behavior + '"');
        }
      }
    } else {
      switch (action) {
        case 'removeformatting':
          this.execCommand('insertHTML', this.selections[0].cloneContents().textContent);
          break;
        case 'style':
          this.wrap('span', function() {
            return new Element('span', {'class': options['value']});
          }, function(element) {
            element.addClassName(options['value']);
          });
          break;
        case 'backcolor':
          this.wrap('font', function() {
            return new Element('font', {style: 'background-color:' + options['value']});
          }, function(element) {
            element.setStyle('background-color:' + options['value']);
          });
          break;
        case 'replaceHTML':
          var selection = this.options['contentWindow'].getSelection();
          var range = this.doc.createRange();
          range.selectNodeContents(this.element);
          selection.addRange(range);
          this.execCommand('insertHTML', options['value']);
          break;
        default: this.execCommand(action, options['value']);
      }
    }
  },

  wrap: function(tagName, newElementCallback, updateElementCallback) {
    var range = this.selections[0];
    var fragment = range.cloneContents();

    if (fragment.containsTags('div table tr td')) {
      this.wrapTextnodes(fragment, tagName, newElementCallback, updateElementCallback);
    } else {
      this.wrapFragment(fragment, newElementCallback, updateElementCallback);
    }
  },

  wrapTextnodes: function(fragment, tagName, newElementCallback, updateElementCallback) {
    var textnodes = fragment.getTextNodes();
    for (var i = 0; i < textnodes.length; ++i) {
      if (textnodes[i].parentNode.tagName != tagName.toUpperCase()) {
        Element.wrap(textnodes[i], newElementCallback.call(this));
      } else {
        updateElementCallback.call(this, textnodes[i].parentNode);
      }
    }

    var wrapper = new Element('div');
    wrapper.appendChild(fragment);

    var html = wrapper.innerHTML;
    this.execCommand('insertHTML', html);
  },

  wrapFragment: function(fragment, newElementCallback) {
    var container = newElementCallback.call(this);
    container.appendChild(fragment);

    var wrapper = new Element('div');
    wrapper.appendChild(container);

    var html = wrapper.innerHTML;
    this.execCommand('insertHTML', html);
  },

  handle: {

    insertHTML: function(action, toolbar, options, callbackOrValue) {
      var value = (Object.isFunction(callbackOrValue)) ?
                  callbackOrValue.call(this, action, toolbar, options) :
                  callbackOrValue;
      this.execCommand('insertHTML', value);
    },

    call: function(action, toolbar, options, callback) {
      callback.call(this, action, toolbar, options);
    }

  }

});
if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  activeRegion: null,
  contexts: [],
  buttons: {},
  palettes: [],
  selects: [],
  panels: [],
  options: {
    appendTo: null,
    contentWindow: window,
    configuration: null
  },

  initialize: function(options) {
    if (!Midas.version) throw('Midas.Toolbar requires Midas');
    this.palettes = [];
    this.selects = [];
    this.panels = [];

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
    this.setupObservers();
  },

  build: function() {
    this.element = new Element('div', {id: this.options['id'] || this.generateId()}).addClassName('midas-toolbar');

    if (this.config['toolbars']) {
      for (var toolbar in this.config['toolbars']) {
        var element = new Element('div').addClassName('midas-' + toolbar + 'bar');
        var buttons = this.config['toolbars'][toolbar];
        for (var button in buttons) {
          element.appendChild(this.makeButton(button, buttons[button]));
        }
        this.element.appendChild(element);
      }
    }
    this.positioningElement = new Element('div', {style: 'clear:both;height:0;overflow:hidden'});
    this.element.appendChild(this.positioningElement);

    var appendTo = document.body;
    if (this.options['appendTo']) {
      appendTo = $(this.options['appendTo']);
      this.element.setStyle('position:static;top:0;left:0');
    }
    appendTo.appendChild(this.element);
  },

  setupObservers: function() {
    this.__mousedown = function(e) { e.stop() }.bind(this);
    this.__mouseup = function(e) {
      this.hidePopups(Event.element(e));
    }.bind(this);
    this.__keydown = function(e) {
      if (e.keyCode == 27) this.hidePopups();
    }.bind(this);

    Event.observe(this.element, 'mousedown', this.__mousedown);
    var observedDocuments = [document];
    if (this.options['contentWindow'].document != document) observedDocuments.push(this.options['contentWindow'].document);
    observedDocuments.each(function(doc) {
      Event.observe(doc, 'mouseup', this.__mouseup);
      Event.observe(doc, 'keydown', this.__keydown);
    }.bind(this));
  },

  removeObservers: function() {
    Event.stopObserving(this.element, 'mousedown', this.__mousedown);
    var observedDocuments = [document];
    if (this.options['contentWindow'].document != document) observedDocuments.push(this.options['contentWindow'].document);
    observedDocuments.each(function(doc) {
      Event.stopObserving(doc, 'mouseup', this.__mouseup);
      Event.observe(doc, 'keydown', this.__keydown);
    }.bind(this));
  },

  reinitializeObservers: function() {
    this.removeObservers();
    this.setupObservers();
  },

  generateId: function() {
    if (this.id) return this.id;
    
    var id = null;
    var element = '';
    while (element !== null) {
      id = 'midas_toolbar' + parseInt(Math.random() * 10000);
      element = $(id);
    }

    this.id = id;
    return id;
  },

  makeButton: function(action, buttonSpec) {
    var element;
    if (Object.isArray(buttonSpec)) {
      var types = buttonSpec.without(buttonSpec[0]).without(buttonSpec[1]);

      element = new Element('div', {title: buttonSpec[1] ? buttonSpec[1] : buttonSpec[0], 'class': 'midas-button'});
      element.update('<em>' + buttonSpec[0] + '</em>');
      element.addClassName('midas-button-' + action.replace('_', '-'));

      var observed = false;
      types.each(function(buttonType) {
        var type = buttonType[0];
        var mixed = buttonType[1];
        switch(type) {
          case 'context':
            this.contexts.push({element: element, callback: mixed || action});
            break;
          case 'toggle':
            element.observe('click', function() { element.toggleClassName('pressed'); });
            break;
          case 'mode':
            element.observe('click', function() { Midas.fire('mode', {mode: mixed || action, toolbar: this}); }.bind(this));
            break;

          case 'palette':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.addClassName('midas-palette-button');
            this.palettes.push(new Midas.Palette(element, action, this, {url: Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed}));
            observed = true;
            break;
          case 'select':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.addClassName('midas-select-button');
            element.down('em').update(buttonSpec[0]);
            this.selects.push(new Midas.Select(element, action, this, {url: Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed}));
            observed = true;
            break;
          case 'panel':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.addClassName('midas-panel-button');
            this.panels.push(new Midas.Panel(element, action, this, {url: Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed, title: buttonType[2] || buttonSpec[0]}));
            observed = true;
            break;
          case 'modal':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.observe('click', function() {
              var url = Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed;
              Midas.modal(url, {title: buttonType[2] || buttonSpec[0]});
            }.bind(this));
            observed = true;
            break;

          default:
            throw('Unknown button type "' + type + '" for the "' + action + '" button');
        }
      }.bind(this));

      element.observe('mousedown', function() { element.addClassName('active'); });
      element.observe('mouseup', function() { element.removeClassName('active'); });

      if (!observed) element.observe('click', function(event) {
        event.stop();
        if (element.hasClassName('disabled') || element.up('.disabled')) return;
        Midas.fire('button', {
          action: action,
          event: event,
          toolbar: this
        });
      }.bind(this));

      this.buttons[action] = {element: element, spec: buttonSpec};
    } else if (Object.isString(buttonSpec)) {
      element = this.makeSeparator(buttonSpec);
    } else {
      element = this.makeButtonGroup(action, buttonSpec);
    }
    return element;
  },

  makeButtonGroup: function(action, group) {
    var element = new Element('div', {'class': 'midas-group midas-group-' + action});
    for (var button in group) {
      element.appendChild(this.makeButton(button, group[button]));
    }
    return element;
  },

  makeSeparator: function(button) {
    return new Element('span').addClassName('midas-' + (button == '*' ? 'flex-separator' : button == '-' ? 'line-separator' : 'separator'));
  },

  setActiveRegion: function(region) {
    this.activeRegion = region;
  },

  setActiveButtons: function(regions, activeRegion) {
    var selection = this.options['contentWindow'].getSelection();
    if (!selection.rangeCount) return;

    var range = selection.getRangeAt(0);

    var node = range.commonAncestorContainer;
    node = node.nodeType == 3 ? Element.up(node) : node;
    if (!node) return;

    if (node != activeRegion.element && !Element.descendantOf(node, activeRegion.element)) return;

    var length = this.contexts.length;
    for (var i = 0; i < length; ++i) {
      var context = this.contexts[i];

      var callback;
      if (typeof(context['callback']) == 'function') {
        callback = context['callback'];
      } else {
        callback = Midas.Toolbar.contexts[context['callback']];
      }

      if (typeof(callback) == 'function') {
        if (callback.call(this, node, activeRegion)) {
          context['element'].addClassName('active');
        } else {
          context['element'].removeClassName('active');
        }
      }
    }
  },

  unsetActiveButtons: function() {
    this.element.select('.active').each(function(button) {
      button.removeClassName('active');
    });
  },

  getBottomOffset: function() {
    return this.positioningElement.cumulativeOffset().top;
  },

  toggleDisabled: function() {
    for (var i = 0; i < arguments.length; ++i) {
      var element;
      element = this.element.down('.midas-' + arguments[i]);
      if (!element) element = this.element.down('.midas-group-' + arguments[i]);
      if (!element) element = this.element.down('.midas-button-' + arguments[i]);
      if (element) element.toggleClassName('disabled');
    }
  },

  hidePopups: function(element) {
    this.palettes.each(function(palette) {
      if (element != palette.element || !element.descendantOf(palette.element)) {
        if (element != palette.button) palette.hide();
      }
    }.bind(this));
    this.selects.each(function(select) {
      if (element != select.element || !element.descendantOf(select.element)) {
        if (element != select.button) select.hide();
      }
    }.bind(this));
  },

  hidePanels: function() {
    this.panels.each(function(panel) {
      panel.hide();
    }.bind(this));
  },

  destroy: function() {
    this.removeObservers();

    this.palettes.each(function(palette) { if (palette.destroy) palette.destroy(); });
    this.selects.each(function(select) { if (select.destroy) select.destroy(); });
    this.panels.each(function(panel) { if (panel.destroy) panel.destroy(); });
    this.palettes = [];
    this.selects = [];
    this.panels = [];
    
    if (this.element) this.element.remove();
    if (this.element) this.element = null;
  }
});

// Midas.Toolbar static methods
Object.extend(Midas.Toolbar, {
  contexts: {
    backcolor:           function(node) {
                           this.buttons['backcolor']['element'].setStyle('background-color:' + node.getStyle('background-color'));
                         },
    forecolor:           function(node) {
                           this.buttons['forecolor']['element'].setStyle('background-color:' + node.getStyle('color'));
                         },
    bold:                function(node) {
                           var weight = Element.getStyle(node, 'font-weight');
                           return weight == 'bold' || weight > 400;
                         },
    italic:              function(node) {
                           return Element.getStyle(node, 'font-style') == 'italic' || node.nodeName == 'I' || node.up('i') || node.nodeName == 'EM' || node.up('em');
                         },
    strikethrough:       function(node) {
                           return Element.getStyle(node, 'text-decoration') == 'line-through' || node.nodeName == 'STRIKE' || node.up('strike');
                         },
    underline:           function(node) {
                           return Element.getStyle(node, 'text-decoration') == 'underline' || node.nodeName == 'U' || node.up('u');
                         },
    subscript:           function(node) {
                           return node.nodeName == 'SUB' || node.up('sub');
                         },
    superscript:         function(node) {
                           return node.nodeName == 'SUP' || node.up('sup');
                         },
    justifyleft:         function(node) {
                           return (Element.getStyle(node, 'text-align') || '').indexOf('left') > -1;
                         },
    justifycenter:       function(node) {
                           return (Element.getStyle(node, 'text-align') || '').indexOf('center') > -1;
                         },
    justifyright:        function(node) {
                           return (Element.getStyle(node, 'text-align') || '').indexOf('right') > -1;
                         },
    justifyfull:         function(node) {
                           return (Element.getStyle(node, 'text-align') || '').indexOf('justify') > -1;
                         },
    insertorderedlist:   function(node, region) {
                           if (node.nodeName == 'OL') return true;
                           var ol = Element.up(node, 'ol');
                           return (ol) ? ol.descendantOf(region.element) : false;
                         },
    insertunorderedlist: function(node, region) {
                           if (node.nodeName == 'ul') return true;
                           var ul = Element.up(node, 'ul');
                           return (ul) ? ul.descendantOf(region.element) : false;
                         }
  }
});if (!Midas) var Midas = {};
Midas.Statusbar = Class.create({
  version: 0.2,
  options: {
    appendTo: null,
    configuration: null,
    contentWindow: window,
    panels: ['Path']
  },

  initialize: function(options) {
    if (!Midas.version) throw('Midas.Statusbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
    this.setupObservers();
  },

  build: function() {
    this.element = new Element('div', {'class': 'midas-statusbar'});

    this.options.panels.each(function(method) {
      this.element.innerHTML += this['insert' + method].call(this);
    }.bind(this));

    ($(this.options['appendTo']) || document.body).appendChild(this.element);
  },

  setupObservers: function() {
    Event.observe(this.element, 'mousedown', function(e) {
      e.stop();
    }.bind(this));
  },

  update: function(region, event) {
    setTimeout(function() {
      this.element.innerHTML = '';
      this.options.panels.each(function(method) {
        this['insert' + method].call(this, region, event);
      }.bind(this));
    }.bind(this), 1);
  },

  getHeight: function() {
    return ($(this.options['appendTo']) || this.element).getHeight();
  },
  
  destroy: function() {
    this.element.remove();
  },

  insertPath: function(region, event) {
    if (!event) return '<span><strong>Path:</strong></span>';
    
    var selection = this.options['contentWindow'].getSelection();
    if (!selection.rangeCount) return;
    var range = selection.getRangeAt(0);

    var path = '';
    var node = range.commonAncestorContainer;
    node = node.nodeType == 3 ? Element.up(node) : node;
    this.path = [];

    if (node != region.element && Element.descendantOf(node, region.element)) {
      this.path = Element.ancestors(node);

      var length = this.path.length - 1;
      for (var i = 0; i <= length; ++i) {
        if (this.path[i] == region.element) break;
        path = '<a>' + this.path[i].tagName.toLowerCase() + '</a> &raquo; ' + path;
      }
      path += '<a>' + node.tagName.toLowerCase() + '</a>';
      this.path[-1] = node;
    }

    var element = new Element('span').update('<strong>Path:</strong> ' + path);
    element.observe('click', function(event) {
      event.stop();
      var index = Element.nextSiblings(Event.element(event)).length;
      var selection = this.options['contentWindow'].getSelection();
      var range = this.options['contentWindow'].document.createRange();
      range.selectNode(this.path[index - 1]);
      selection.removeAllRanges();
      selection.addRange(range);
    }.bindAsEventListener(this));

    this.element.appendChild(element);
  }
});if (!Midas) var Midas = {};
Midas.Dialog = Class.create({
  version: 0.2,
  button: null,
  element: null,
  setupFunction: null,
  scopeId: Math.random(),
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
      this.position(this.visible);
    }.bind(this));
    Event.observe(this.element, 'mousedown', function(e) {
      e.stop();
    });
    Event.observe(this.button, 'click', function() {
      if (!this.element || this.disabled()) return;
      if (this.visible) this.hide();
      else this.show();
    }.bind(this));
  },

  show: function() {
    if (!this.loaded) {
      this.position();
      this.appear();
      return;
    }

    if (this.toolbar.activeRegion) {
      this.contextClass = this.toolbar.activeRegion.name;
      this.element.addClassName(this.contextClass);
    }
    this.element.setStyle({width: 'auto', height: 'auto'});

    this.position(this.visible);
    this.appear();
  },

  appear: function() {
    this.visible = true;
    new Effect.Appear(this.element, {
      queue: {scope: 'dialog:' + this.scopeId, limit: 2},
      transition: Effect.Transitions.sinoidal,
      duration: .20,
      afterFinish: function() {
        var callback = (this.resize || this.show).bind(this);
        if (!this.loaded) this.load(callback);
      }.bind(this)
    });
  },

  hide: function() {
    if (this.contextClass) {
      this.element.removeClassName(this.contextClass);
      this.contextClass = null;
    }

    this.element.hide();
    this.visible = false;
  },

  position: function(keepVisible) {
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
if (!Midas) var Midas = {};
Midas.Palette = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-palette loading', style: 'display:none;'});
    this.toolbar.element.appendChild(this.element);
    if (Midas.Config.preloadPalettes) this.load();
  },

  position: function(keepVisible) {
    if (!this.element) return;

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
  }
});if (!Midas) var Midas = {};
Midas.Select = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-select loading', style: 'display:none;'});
    this.toolbar.element.appendChild(this.element);
    if (Midas.Config.preloadSelects) this.load();
  },

  position: function(keepVisible) {
    if (!this.element) return;

    this.element.setStyle({top: 0, left: 0, display: 'block', visibility: 'hidden'});
    var position = this.button.cumulativeOffset();
    var dimensions = this.element.getDimensions();
    var viewportDimensions = document.viewport.getDimensions();

    var top = (position.top + (this.button.getHeight() / 2) - (dimensions.height / 2));
    if (top < position.top - 100) top = position.top - 100;
    if (top < 20) top = 20;

    var height = 'auto';
    if (top + dimensions.height >= viewportDimensions.height - 20) {
      height = (viewportDimensions.height - top - 20);
    }

    if (position.left + dimensions.width > viewportDimensions.width) {
      position.left = position.left - dimensions.width + this.button.getWidth();
    }
    
    this.element.setStyle({
      top: top + 'px',
      left: position.left + 'px',
      height: height + 'px',
      display: keepVisible ? 'block' : 'none',
      visibility: 'visible'
    });
  }
});
if (!Midas) var Midas = {};
Midas.Panel = Class.create(Midas.Dialog, {
  version: 0.2,

  build: function() {
    this.element = new Element('div', {'class': 'midas-panel loading', style: 'display:none;'});
    this.element.update('<h3 class="title">' + this.options['title'] + '</h3><div class="midas-panel-pane"></div>');

    this.toolbar.element.appendChild(this.element);

    this.titleElement = this.element.down('h3.title');
    this.panelElement = this.element.down('div.midas-panel-pane');
  },

  setupObservers: function() {
    Event.observe(window, 'resize', function() {
      this.position(this.visible);
    }.bind(this));
    Event.observe(this.element, 'mousedown', function(e) {
      e.stop();
    });
    Event.observe(this.button, 'click', function() {
      if (!this.element || this.disabled()) return;
      if (this.visible) this.hide();
      else {
        this.toolbar.hidePanels();
        this.button.addClassName('pressed');
        this.show();
      }
    }.bind(this));
  },

  position: function(keepVisible) {
    if (!this.element) return;

    this.element.setStyle({display: 'block', visibility: 'hidden', width: 'auto'});

    var top = this.toolbar.getBottomOffset();
    var height = document.viewport.getHeight() - top - 40;
    var position = this.element.cumulativeOffset();
    var elementWidth = this.element.getWidth();
    this.viewportWidth = document.viewport.getWidth();

    this.element.setStyle({
      top: (top + 8) + 'px',
      height: height + 'px',
      width: 'auto',
      display: keepVisible ? 'block' : 'none',
      visibility: 'visible'
    });

    if (!this.moved) {
      this.element.setStyle({left: (this.viewportWidth - elementWidth - 20) + 'px'}); 
    }

    if (this.pinned || elementWidth + position.left > this.viewportWidth) {
      this.element.setStyle({left: (this.viewportWidth - elementWidth - 20) + 'px'});
    }

    if (!this.draggable) {
      this.draggable = new Draggable(this.element, {
        handle: this.titleElement,
        constraint: 'horizontal',
        zindex: 10003,
        snap: function(x, y) {
          var elementWidth = this.element.getWidth();
          x = (x < 30) ? 10 : x;
          if (x > this.viewportWidth - (elementWidth + 40)) {
            x = this.viewportWidth - (elementWidth + 20);
            this.pinned = true;
            this.moved = true;
          } else {
            this.pinned = false;
          }
          return [x, y];
        }.bind(this)
      });
    }

    var paddingHeight = parseInt(this.panelElement.getStyle('padding-top')) + parseInt(this.panelElement.getStyle('padding-bottom'));
    var titleHeight = parseInt(this.titleElement.getStyle('padding-top')) + parseInt(this.titleElement.getStyle('padding-bottom')) + parseInt(this.titleElement.getStyle('height'));

    if (!keepVisible) this.element.hide();
    this.panelElement.setStyle({height: (height - paddingHeight - titleHeight) + 'px'});
  },

  resize: function() {
    var oldWidth = this.panelElement.getWidth();
    this.panelElement.setStyle({width: 'auto'});
    var newWidth = this.panelElement.getWidth();
    this.panelElement.setStyle({width: oldWidth + 'px'});
    var position = this.element.cumulativeOffset();

    if (newWidth <= oldWidth) {
      this.panelElement.setStyle({visibility: 'visible', width: 'auto'});
      return;
    }

    new Effect.Parallel([
      new Effect.Morph(this.panelElement, { style: {width: newWidth + 'px'} }),
      new Effect.Morph(this.element, { style: {left: position.left - (newWidth - oldWidth) + 'px'} })
      ], {
      transition: Effect.Transitions.sinoidal,
      duration: .2,
      afterFinish: function() {
        this.panelElement.setStyle({visibility: 'visible', width: 'auto'});
      }.bind(this)
    });
  },

  load: function(callback) {
    new Ajax.Request(this.options.url, {
      method: 'get',
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.panelElement.setStyle({visibility: 'hidden', width: this.panelElement.getWidth() + 'px'});
        this.panelElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.setupFunction = window['midas_setup_' + this.name];
        if (this.setupFunction) this.setupFunction.call(this);

        if (callback) callback();
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + this.options.url + '" for the "' + this.name + '" panel');
      }.bind(this)
    });
  },

  appear: function() {
    this.visible = true;
    new Effect.Appear(this.element, {
      transition: Effect.Transitions.sinoidal,
      duration: .2,
      from: 0,
      to: .85,
      afterFinish: function() {
        if (!this.loaded) this.load(this.resize.bind(this));
      }.bind(this)
    });
  },

  hide: function($super) {
    this.button.removeClassName('pressed');
    $super();
  }

});if (!Midas) var Midas = {};
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
    this._options = Object.clone(this.options);
    Object.extend(this._options, options || {});

    if (this.initialized) return false;

    this._build();
    this._setupObservers();
    this.initialized = true;
  },

  _build: function() {
		this.overlayElement = new Element('div', {id: 'midas_modal_overlay', style: 'display:none'});
		this.element = new Element('div', {id: 'midas_modal', style: 'display:none'});
    this.element.update('<form class="midas-modal-frame"><h1><span></span><a>&times;</a></h1><div class="midas-modal-content-container"><div class="midas-modal-content"></div></div></form>');

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
    Event.observe(this.overlayElement, 'mouseup', function(event) { event.stop(); });
    Event.observe(this.element, 'mouseup', function(event) { event.stop(); });
    Event.observe(this.frameElement, 'submit', function(e) {
      if (window['midas_modal_submit']) window['midas_modal_submit'](e);
    });

    var documents = [document];
    var iframe = $('midas-iframe-window');
    if (iframe) documents.push(iframe.contentWindow.document);
    documents.each(function(doc) {
      Event.observe(doc, 'keydown', function(e) {
        if (this.showing && e.keyCode == 27) this.hide();
      }.bind(this));
    }.bind(this));
  },

  show: function(url, options) {
    this._initialize(options);

    this.contentElement.innerHTML = '';
    this.load(url);
    this.updateTitle();

		if (!this.showing) {
      this.showing = true;
      this.overlayElement.show();
      this.element.setStyle({display: 'block', visibility: 'visible', position: null});
      this.frameElement.setStyle({display: 'block', visibility: 'visible', position: null});
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

    if (options) {
      this._options = Object.clone(this.options);
      Object.extend(this._options, options);
    }

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
    if (this._options['title']) {
      titleElement.show();
      titleElement.update(this._options['title'] || '&nbsp;');
    } else {
      titleElement.hide();
    }
  },

  load: function(url, options) {
    if (options) {
      this._options = Object.clone(this.options);
      Object.extend(this._options, options);
    }

    this.element.addClassName('loading');

    new Ajax.Request(url, {
      method: this._options['method'] || 'get',
      parameters: this._options['parameters'] || {},
      onSuccess: function(transport) {
        this.loaded = true;
        this.element.removeClassName('loading');
        this.contentElement.innerHTML = transport.responseText;
        transport.responseText.evalScripts();

        this.setupControls();

        this.position();
        this.fire('afterLoad');
      }.bind(this),
      onFailure: function() {
        this.hide();
        alert('Midas was unable to load "' + url + '" for the modal');
      }.bind(this)
    });
  },

  position: function() {
    if (!this.element) return;
    
    this.frameElement.setStyle('width:auto');
    this.contentElement.setStyle('height:auto');
    this.contentContainerElement.setStyle('height:auto');

    this.frameElement.setStyle({display: 'block'});


    var dimensions = this.frameElement.getDimensions();

    this.element.setStyle({width: dimensions.width + 'px'});
    this.frameElement.setStyle({width: dimensions.width + 'px'});

    this.contentElement.hide();
    this.contentElement.slideDown();

    var viewportDimensions = document.viewport.getDimensions();
    if (dimensions.height >= viewportDimensions.height - 20 || this._options['fullHeight']) {
      var titleHeight = this.element.down('h1').getHeight();
      var controlsHeight = this.controls ? this.controls.offsetHeight : 0;
      this.contentContainerElement.setStyle({height: (viewportDimensions.height - titleHeight - controlsHeight - 20) + 'px'});
      this.contentElement.setStyle({height: (viewportDimensions.height - titleHeight - controlsHeight - 60) + 'px'});
    }
  },

  setupControls: function() {
    this.controls = this.contentElement.down('.midas-modal-controls');
    if (this.controls) {
      this.frameElement.appendChild(this.controls);
    }

    this.paneIndex = 0;
    this.panes = this.frameElement.select('.midas-modal-pane');
    if (this.panes.length > 1) {
      if (!this.controls) {
        this.controls = new Element('div', {'class': 'midas-modal-controls'});
        this.frameElement.appendChild(this.controls);
      }

      this.prevButton = new Element('input', {type: 'button', value: 'Previous', disabled: 'disabled'});
      this.nextButton = new Element('input', {type: 'button', value: 'Next'});

      this.prevButton.observe('click', this.prevPane.bind(this));
      this.nextButton.observe('click', this.nextPane.bind(this));

      this.controls.insert({top: this.prevButton});
      this.prevButton.insert({after: this.nextButton});

      this.showPane(0);
    }
  },

  prevPane: function() {
    this.showPane(this.paneIndex - 1);
  },

  nextPane: function() {
    this.showPane(this.paneIndex + 1);
  },

  showPane: function(index) {
    this.paneIndex = index;
    if (this.paneIndex <= 0) {
      this.paneIndex = 0;
      this.prevButton.disable();
    } else {
      this.prevButton.enable();
    }

    if (this.paneIndex >= this.panes.length - 1) {
      this.paneIndex = (this.panes.length - 1);
      this.nextButton.disable();
    } else {
      this.nextButton.enable();
    }

    this.panes.each(function(pane) {
      pane.setStyle('display:none');
    });

    this.panes[this.paneIndex].setStyle('display:block');
  },

  fire: function(eventName) {
    var r = true;
    if (this._options[eventName]) {
      var returnValue = this._options[eventName].call(this);
      if (!Object.isUndefined(returnValue)) r = returnValue;
      this._options[eventName] = null;
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
Midas.Config = {

  /* The stylesheet to load for the skin of the toolbar/editable regions.
   */
  stylesheet: '/stylesheets/midas.css',

  /* Things like palettes, and select menus can be preloaded when the page loads, instead of
   * loading the first time the button is clicked.
   */
  preloadPalettes: true,
  preloadSelects: true,

  /* Toolbars
   *
   * Any object you put in here will create a new toolbar.
   *
   * button format: [label, description, [type, action], [type, action], etc]
   * type can be:
   *   'button' (default) calls handleCommand and passes the key of the object
   *            (eg. save, preview, undo etc.)
   *   'toggle' will toggle on or off when clicked (and otherwise behaves like a button)
   *   'modal' will open a modal window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *     note: optionally provide a second string argument for the modal dialog title
   *   'panel' will open a panel dialog, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *     note: optionally provide a second string argument for the panel title
   *   'palette' will open a palette window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'select' will open a select/pulldown style window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'context' will call a callback function, expects the action to be:
   *     a function that returns a boolean to highlight the button or not
   *     note: if a function isn't provided, the key will be passed to the
   *           contextHandler (eg. backcolor, bold, etc.), in which case a
   *           default context will be used (there are several defined in
   *           Midas.Toolbar.contexts).
   *   'mode' will toggle a given mode in the editor, expects the action to be:
   *     a string, denoting the name of the mode
   *     note: if a string isn't provided, the key will be passed to the
   *           modeHandler (eg. preview, html, etc.)
   *     note: it's assumed that when a specific "mode" is turned on, all other "modes" will be
   *           turned off (this happens automatically), thus putting the editor into a specific
   *           "state".
   *
   * If a button is an object (not an array, not a string), it's assumed that it's a button group,
   * all of it's children will be expected to be buttons or button groups.  A button group is
   * wrapped within a div for styling.  It's important to note that each of the keys, regardless of
   * if it's in a group or not needs to be unique.
   *
   * The save action is special, in that it's handled by Midas directly, all other actions are
   * handled by Midas.Region.
   *
   * Separators are any "button" that's not an array, and are expected to be a string.  You can use
   * three different separator styles: line, spacer, and flex spacer.
   * '-' = line
   * ' ' = spacer
   * '*' = flex spacer
   */
  toolbars: {
    actions: {
      save:                  ['Save', 'Save this page'],
      preview:               ['Preview', 'Preview this page', ['toggle'], ['mode']],
      sep1:                  ' ',
      undoredo:              {
        undo:                ['Undo', 'Undo your last action'],
        redo:                ['Redo', 'Redo your last action'],
        sep2:                ' '
        },
      insert:                {
        insertlink:          ['Link', 'Insert a hyperlink', ['modal', '/midas/link.html']],
        insertmedia:         ['Media', 'Insert media', ['modal', '/midas/media.html']],
        inserttable:         ['Table', 'Insert a table', ['modal', '/midas/table.html']],
        insertobject:        ['Object', 'Insert an object (form, widget, etc)', ['modal', '/midas/object.html']],
        insertcharacter:     ['Character', 'Insert special characters', ['modal', '/midas/character.html']],
        sep3:                '*'
        },
      inspector:             {
        inspectorpanel:      ['Inspector', 'Open the element inspector panel', ['panel', '/midas/inspector.html']],
        sep3:                '*'
        },
      notespanel:            ['Notes', 'Open the page notes panel', ['panel', '/midas/notes.html', 'Page Notes']],
      historypanel:          ['History', 'Open the page history panel', ['panel', '/midas/history.html']]
      },
    htmleditor: {
      style:                 ['Style', '', ['select', '/midas/style.html']],
      formatblock:           ['Block Format', '', ['select', '/midas/formatblock.html']],
      sep1:                  '-',
      backcolor:             ['Background Color', '', ['palette', '/midas/backcolor.html'], ['context']],
      forecolor:             ['Text Color', '', ['palette', '/midas/forecolor.html'], ['context']],
      sep2:                  '-',
      decoration:            {
        bold:                ['Bold', '', ['context']],
        italic:              ['Italicize', '', ['context']],
        //overline:            ['Overline', '', ['context']],
        strikethrough:       ['Strikethrough', '', ['context']],
        underline:           ['Underline', '', ['context']],
        sep:                 '-'
        },
      script:                {
        subscript:           ['Subscript', '', ['context']],
        superscript:         ['Superscript', '', ['context']],
        sep:                 '-'
        },
      justify:               {
        justifyleft:         ['Align Left', '', ['context']],
        justifycenter:       ['Center', '', ['context']],
        justifyright:        ['Align Right', '', ['context']],
        justifyfull:         ['Justify Full', '', ['context']],
        sep:                 '-'
        },
      list:                  {
        insertunorderedlist: ['Unordered List', '', ['context']],
        insertorderedlist:   ['Numbered List', '', ['context']],
        sep:                 '-'
        },
      indent:                {
        outdent:             ['Decrease Indentation', ''],
        indent:              ['Increase Indentation', ''],
        sep:                 '-'
        },
      //table:                 {
      //  insertrowbefore:     ['Insert Row', 'Insert a table row before'],
      //  insertrowafter:      ['Insert Row', 'Insert a table row after'],
      //  deleterow:           ['Delete Row', 'Delete this table row'],
      //  insertcolumnbefore:  ['Insert Column', 'Insert a table column before'],
      //  insertcolumnafter:   ['Insert Column', 'Insert a table column after'],
      //  deletecolumn:        ['Delete Column', 'Delete this table column'],
      //  sep:                 '-'
      //  },
      breaks:                {
        horizontalrule:      ['Horizontal Rule', ''],
        sep:                 '-'
        },
      removeformatting:      ['Remove Formatting', ''],
      htmleditor:            ['Edit HTML', '']
      }
    },

  /* Behaviors for htmleditor
   *
   * Behaviors are used to change the default behaviors of the editor when a given button is
   * clicked.  For example, we prefer to add HR tags using an HR wrapped within a div with a
   * classname of hr, which allows for more flexible styling.  To add your own complex
   * behaviors just prototype them onto Midas.Region.handle.
   *
   * An example behavior would be to add a new button, called buynowbutton, and providing a
   * behavior something like the following:
   *
   * buynowbutton: {insertElement: function() {
   *   return new Element('a', {href: '/buy-now', class: 'buy-now'}).update('Buy Now!');
   * }}
   *
   * It's important to note that the this keyword inside the callback functions is an instance of
   * Midas.Region.
   */
  behaviors: {
    horizontalrule:      {insertHTML: function() {
                           return '<div class="hr"><hr/></div>';
                         }},
    htmleditor:          {call: function() {
                           Midas.modal('/midas/htmleditor.html', {
                             title: 'HTML Editor',
                             fullHeight: true,
                             afterLoad: function() {
                               $('midas_html_editor_content').value = this.getContents();
                             }.bind(this)
                           });
                         }}
    }
};