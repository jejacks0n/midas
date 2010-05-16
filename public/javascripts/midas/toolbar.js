if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  contexts: [],
  options: {
    appendTo: null,
    configuration: null
  },

  initialize: function(options) {
    if (!Midas.version) throw('Midas.Toolbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;

    this.build();
  },

  build: function() {
    this.element = new Element('div', {id: this.options['id'] || this.generateId()}).addClassName('midas-toolbar');

    if (this.options['configuration']['toolbars']) {
      for (var toolbar in this.options['configuration']['toolbars']) {
        var element = new Element('div').addClassName('midas-' + toolbar + 'bar');
        var buttons = this.options['configuration']['toolbars'][toolbar];
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

  makeButton: function(name, buttonSpec) {
    var element;
    if (Object.isArray(buttonSpec)) {
      element = new Element('a', {href: '#', title: buttonSpec[1] ? buttonSpec[1] : buttonSpec[0]});
      element.update('<em>' + buttonSpec[0] + '</em>');
      element.addClassName('midas-button-' + name.replace('_', '-'));
      element.observe('click', function(event) {
        Event.fire(document, 'midas:toolbar', {toolbar: this, name: name, spec: buttonSpec, event: event});
      }.bind(this));

      var buttonTypes = buttonSpec.without(buttonSpec[0]).without(buttonSpec[1]);
      buttonTypes.each(function(buttonType) {
        var type = buttonType[0];
        var action = buttonType[1];
        switch(type) {
          case 'toggle':
            element.observe('click', function() {
              element.toggleClassName('pressed');
            });
            break;
          case 'context':
            this.contexts.push({element: element, callback: action || name});
            break;
          case 'dialog':
            if (!action) throw('Button ' + name + ' is missing arguments');
            element.observe('click', function() {
              var url = Object.isFunction(action) ? action(name, this) : action;
              alert('this would open a dialog with the url: ' + url);
            }.bind(this));
            break;
          case 'panel':
            if (!action) throw('Button ' + name + ' is missing arguments');
            element.observe('click', function() {
              var url = Object.isFunction(action) ? action(name, this) : action;
              alert('this would open a panel with the url: ' + url);
            }.bind(this));
            break;
          case 'palette':
            if (!action) throw('Button ' + name + ' is missing arguments');
            element.observe('click', function() {
              var url = Object.isString(action) ? action : action(name, this);
              alert('this would open a palette with the url: ' + url);
            }.bind(this));
            break;
          case 'select':
            if (!action) throw('Button ' + name + ' is missing arguments');
            element.observe('click', function() {
              var contents = Object.isArray(action) ? action : action(name, this);
              alert('this would open a place a pulldown near the button with the contents: ' + contents.join(','));
            }.bind(this));
            break;
          default:
            if (type) throw('Unknown button type ' + type + ' for the ' + name + ' button');
        }
      }.bind(this));
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
