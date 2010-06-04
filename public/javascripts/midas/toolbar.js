if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  contexts: [],
  buttons: {},
  palettes: [],
  options: {
    appendTo: null,
    configuration: null
  },

  initialize: function(options) {
    if (!Midas.version) throw('Midas.Toolbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
    this.setupObservers();
  },

  build: function() {
    this.element = new Element('div', {id: this.options['id'] || this.generateId()}).addClassName('midas-toolbar');
    this.element.appendChild(new Element('link', {rel: 'stylesheet', href: this.config.stylesheet}));

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
    
    ($(this.options['appendTo']) || document.body).appendChild(this.element);    
  },

  setupObservers: function() {
    Event.observe(document, 'mouseup', function(e) {
      var element = Event.element(e);
      this.palettes.each(function(palette) {
        if (element != palette.element || element.descendantOf(palette.element)) palette.hide();
      }.bind(this));
    }.bind(this))
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

      element = new Element('a', {href: '#', title: buttonSpec[1] ? buttonSpec[1] : buttonSpec[0]});
      element.update('<em>' + buttonSpec[0] + '</em>');
      element.addClassName('midas-button-' + action.replace('_', '-'));
      element.observe('click', function(event) {
        event.stop();
        element.blur();
        Midas.fire('button', {
          action: action,
          spec: {label: buttonSpec[0], description: buttonSpec[1], types: types},
          event: event,
          toolbar: this
        });
      }.bind(this));

      types.each(function(buttonType) {
        var type = buttonType[0];
        var mixed = buttonType[1];
        switch(type) {
          case 'toggle':
            element.observe('click', function() {
              element.toggleClassName('pressed');
            });
            break;
          case 'context':
            this.contexts.push({element: element, callback: mixed || action});
            break;
          case 'mode':
            element.observe('click', function() {
              Midas.fire('mode', {mode: mixed || action, toolbar: this});
            }.bind(this));
            break;
          case 'dialog':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.observe('click', function() {
              var url = Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed;
              alert('this would open a dialog with the url: ' + url);
            }.bind(this));
            break;
          case 'panel':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.observe('click', function() {
              var url = Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed;
              alert('this would open a panel with the url: ' + url);
            }.bind(this));
            break;
          case 'palette':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            this.palettes.push(new Midas.Palette(element, action, this, {url: Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed}));
            break;
          case 'select':
            if (!mixed) throw('Button "' + action + '" is missing arguments');
            element.observe('click', function() {
              var contents = Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed;
              alert('this would open a place a pulldown near the button with the contents: ' + contents.join(','));
            }.bind(this));
            break;
          default:
            throw('Unknown button type "' + type + '" for the "' + action + '" button');
        }
      }.bind(this));
      this.buttons[action] = {element: element, spec: buttonSpec};
    } else if (Object.isString(buttonSpec)) {
      element = this.makeSeparator(buttonSpec);
    } else {
      element = this.makeButtonGroup(buttonSpec);
    }
    return element;
  },

  makeButtonGroup: function(group) {
    var element = new Element('div').addClassName('midas-group');
    for (var button in group) {
      element.appendChild(this.makeButton(button, group[button]));
    }
    return element;
  },

  makeSeparator: function(button) {
    return new Element('span').addClassName('midas-' + (button == '*' ? 'flex-separator' : button == '-' ? 'line-separator' : 'separator'));
  },

  setActiveButtons: function(regions, activeRegion) {
    var selection = window.getSelection();
    if (!selection.rangeCount) return;

    var range = selection.getRangeAt(0);

    var node = range.commonAncestorContainer;
    node = node.nodeType == 3 ? Element.up(node) : node;
    if (!node) return;

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

  destroy: function() {
    this.palettes.each(function(palette) {
      palette.destroy();
    });
    this.palettes = [];
    this.element.remove();
    this.element = null;
  }
});

// Midas.Toolbar static methods
Object.extend(Midas.Toolbar, {
  contexts: {
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