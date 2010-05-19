if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  contexts: [],
  buttons: {},
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
    
    ($(this.options['appendTo']) || document.body).appendChild(this.element);
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
            element.observe('click', function() {
              var url = Object.isFunction(mixed) ? mixed.apply(this, [action]) : mixed;
              alert('this would open a palette with the url: ' + url);
            }.bind(this));
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
    var element = new Element('div').addClassName('group');
    for (var button in group) {
      element.appendChild(this.makeButton(button, group[button]));
    }
    return element;
  },

  makeSeparator: function(button) {
    return new Element('span').addClassName(button == '*' ? 'flex-spacer' : button == '-' ? 'line-spacer' : 'spacer');
  },

  destroy: function() {
    this.element.remove();
  }
});

