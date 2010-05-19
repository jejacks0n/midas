if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {
    configuration: null,
    inline: false
  },

  initialize: function(element, options, name) {
    if (!Midas.version) throw('Midas.Region requires Midas');
    if (!Midas.agentIsCapable()) throw('Midas.Region requires a browser that has contentEditable features');

    this.element = $(element);
    if (!this.element) throw('Unable to locate that element');

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];
    this.name = this.element.getAttribute('id') || name;

    this.makeEditable();
    this.setupObservers();
  },

  makeEditable: function() {
    if (this.element.innerHTML.replace(/^\s+|\s+$/g, "") == '') {
      this.setContents('&nbsp;')
    }

    if (this.options['inline']) {
      this.element.setStyle({height: 'auto', minHeight: '20px'});
    } else {
      this.element.setStyle({overflow: 'auto'});
      this.element.setStyle({maxWidth: this.element.getWidth() + 'px'});
    }
    this.element.contentEditable = true;
  },

  setupObservers: function() {
    this.element.observe('focus', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
    }.bind(this));
    this.element.observe('click', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
    }.bind(this));
    this.element.observe('keypress', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
      console.debug(event);
    }.bind(this));

  },

  setContents: function(content) {
    this.element.innerHTML = content;
  },

  getContents: function() {
    return this.element.innerHTML.replace(/^\s+|\s+$/g, "");
  },

  handleAction: function(action, spec, event, toolbar) {
    this.element.focus();
    if (this.config['behaviors'][action]) {
      var behavior = this.config['behaviors'][action];

      switch(typeof(behavior)) {
        case 'function':
          behavior = behavior.call(this, action, '...');
          break;
        case 'string':
          if (behavior.indexOf('$') >= 0) {
            // we're going to wrap content here
            console.info('wrap content here');
          } else {
            this.execCommand(behavior)
          }
          break;
        default:
          throw('Unknown behavior type for "' + action + '"');
      }
    } else {
      this.execCommand(action);
    }
    this.element.focus();
  },

  execCommand: function(action, argument) {
    argument = typeof(argument) == 'undefined' ? null : argument;
    var handled = document.execCommand(action, false, null);
    if (!handled) {
      throw('Unknown action "' + action + '"');
    }
  },

  serialize: function() {
    return {name: this.name, content: this.getContents()}
  },

  destroy: function() {
    this.element.contentEditable = 'false';
  }
});

