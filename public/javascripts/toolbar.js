if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  activeRegion: null,
  toolbars: {},
  groups: {},
  buttons: {},
  contexts: [],
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

    var appendTo = document.body;
    if (this.options['appendTo']) {
      appendTo = $(this.options['appendTo']);
      this.element.setStyle('position:static;top:0;left:0');
    }
    appendTo.appendChild(this.element);

    if (this.config['toolbars']) {
      for (var toolbar in this.config['toolbars']) {
        var element = new Element('div').addClassName('midas-' + toolbar + 'bar');
        var buttons = this.config['toolbars'][toolbar];
        for (var button in buttons) {
          var buttonElement = this.makeButton(button, buttons[button]);
          if (buttonElement) element.appendChild(buttonElement);
        }
        this.element.appendChild(element);
        if (toolbar != 'actions') {
          this.toolbars[toolbar] = {element: element};
          this.disableToolbars(toolbar);
        }
      }
    }
    this.positioningElement = new Element('div', {style: 'clear:both;height:0;overflow:hidden'});
    this.element.appendChild(this.positioningElement);
  },

  setupObservers: function() {
    this.disableToolbar = true;
    this.__mousedown = function(e) { e.stop() };
    this.__doc_mousedown = function(e) {
      var element = Event.element(e);
      if (Element.up(element, '#midas_modal')) {
        this.disableToolbar = false;
      }
    }.bind(this);
    this.__mouseup = function(e) {
      this.hidePopups(Event.element(e));
    }.bind(this);
    this.__keydown = function(e) {
      if (e.keyCode == 27) this.hidePopups();
    }.bind(this);
    this.__keypress = function(e) {
      if (e.metaKey) {
        switch (e.charCode) {
          case 115:
            Midas.fire('button', {action: 'save', event: e, toolbar: this});
            e.stop();
            break;
        }
      }
    }.bind(this);

    if (this.config['toolbars']) {
      for (var toolbar in this.config['toolbars']) {
        Event.observe(document, 'midas:' + toolbar, function() {
          this.enableToolbars(toolbar);
        }.bind(this));
        Event.observe(document, 'midas:' + toolbar + ':blur', function() {
          if (this.disableToolbar) {
            this.disableToolbars(toolbar);
          }
          this.disableToolbar = true;
        }.bind(this))
      }
    }

    Event.observe(this.element, 'mousedown', this.__mousedown);
    var observedDocuments = [document];
    if (this.options['contentWindow'].document != document) observedDocuments.push(this.options['contentWindow'].document);
    observedDocuments.each(function(doc) {
      Event.observe(doc, 'mousedown', this.__doc_mousedown);
      Event.observe(doc, 'mouseup', this.__mouseup);
      Event.observe(doc, 'keydown', this.__keydown);
      Event.observe(doc, 'keypress', this.__keypress);
    }.bind(this));
  },

  removeObservers: function() {
    Event.stopObserving(this.element, 'mousedown', this.__mousedown);
    if (this.config['toolbars']) {
      for (var toolbar in this.config['toolbars']) {
        Event.stopObserving(document, 'midas:' + toolbar);
        Event.stopObserving(document, 'midas:' + toolbar + ':blur');
      }
    }
    var observedDocuments = [document];
    if (this.options['contentWindow'].document != document) observedDocuments.push(this.options['contentWindow'].document);
    observedDocuments.each(function(doc) {
      Event.stopObserving(doc, 'mousedown', this.__doc_mousedown);
      Event.stopObserving(doc, 'mouseup', this.__mouseup);
      Event.stopObserving(doc, 'keydown', this.__keydown);
      Event.stopObserving(doc, 'keypress', this.__keypress);
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
    if (action == '_context') return;
    
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

      if (!observed) element.observe('click', function(e) {
        e.stop();
        if (element.hasClassName('disabled') || element.up('.disabled')) return;
        Midas.fire('button', {
          action: action,
          event: e,
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
    this.groups[action] = {element: element};

    if (group['_context']) {
      element.addClassName(group['_context'][0]);
      this.contexts.push({element: element, callback: action});
    }

    for (var button in group) {
      var buttonElement = this.makeButton(button, group[button]);
      if (buttonElement) element.appendChild(buttonElement);
    }
    return element;
  },

  makeSeparator: function(button) {
    return new Element('span').addClassName('midas-' + (button == '*' ? 'flex-separator' : button == '-' ? 'line-separator' : 'separator'));
  },

  setActiveRegion: function(region) {
    this.activeRegion = region;
  },

  setActiveButtons: function(activeRegion) {
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

  disableToolbars: function() {
    for (var i = 0; i < arguments.length; ++i) {
      if (this.toolbars[arguments[i]]) {
        this.toolbars[arguments[i]]['element'].addClassName('disabled');
      }
      if (this.groups[arguments[i]]) {
        this.groups[arguments[i]]['element'].addClassName('disabled');
      }
      if (this.buttons[arguments[i]]) {
        this.buttons[arguments[i]]['element'].addClassName('disabled');
      }
    }
  },

  enableToolbars: function() {
    for (var i = 0; i < arguments.length; ++i) {
      if (this.toolbars[arguments[i]]) {
        this.toolbars[arguments[i]]['element'].removeClassName('disabled');
      }
      if (this.groups[arguments[i]]) {
        this.groups[arguments[i]]['element'].removeClassName('disabled');
      }
      if (this.buttons[arguments[i]]) {
        this.buttons[arguments[i]]['element'].removeClassName('disabled');
      }
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

    table: function(node, region) {
      var table = node.up('table');
      if (table && table.descendantOf(region.element)) this.groups['table']['element'].removeClassName('disabled');
      else this.groups['table']['element'].addClassName('disabled');
    },

    backcolor: function(node) {
      this.buttons['backcolor']['element'].setStyle('background-color:' + node.getStyle('background-color'));
    },

    forecolor: function(node) {
      this.buttons['forecolor']['element'].setStyle('background-color:' + node.getStyle('color'));
    },

    bold: function(node) {
      var weight = Element.getStyle(node, 'font-weight');
      return weight == 'bold' || weight > 400;
    },

    italic: function(node) {
      return Element.getStyle(node, 'font-style') == 'italic' || node.nodeName == 'I' || node.up('i') || node.nodeName == 'EM' || node.up('em');
    },

    strikethrough: function(node) {
      return Element.getStyle(node, 'text-decoration') == 'line-through' || node.nodeName == 'STRIKE' || node.up('strike');
    },

    underline: function(node) {
      return Element.getStyle(node, 'text-decoration') == 'underline' || node.nodeName == 'U' || node.up('u');
    },

    subscript: function(node) {
      return node.nodeName == 'SUB' || node.up('sub');
    },

    superscript: function(node) {
      return node.nodeName == 'SUP' || node.up('sup');
    },

    justifyleft: function(node) {
      return (Element.getStyle(node, 'text-align') || '').indexOf('left') > -1;
    },

    justifycenter: function(node) {
      return (Element.getStyle(node, 'text-align') || '').indexOf('center') > -1;
    },

    justifyright: function(node) {
      return (Element.getStyle(node, 'text-align') || '').indexOf('right') > -1;
    },

    justifyfull: function(node) {
      return (Element.getStyle(node, 'text-align') || '').indexOf('justify') > -1;
    },

    insertorderedlist: function(node, region) {
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
});