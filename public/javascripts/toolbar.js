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
});