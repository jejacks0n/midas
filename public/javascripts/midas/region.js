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
    if (!this.element) throw('Unable to locate the element "' + element + '"');
    this.sibling = this.element.previousSibling;

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];
    this.name = this.element.getAttribute('id') || name;
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
      this.element.setStyle({height: 'auto', minHeight: '20px'});
    } else {
      this.element.setStyle({overflow: 'auto'});
      this.element.setStyle({maxWidth: this.element.getWidth() + 'px'});
    }
    this.element.contentEditable = true;
    
    document.execCommand('styleWithCSS', false, false);
    //document.execCommand('enableInlineTableEditing', false, false);
  },

  setupObservers: function() {
    this.element.observe('focus', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
      if (this.getContents() == '&nbsp;' && Prototype.Browser.Gecko) this.setContents('&nbsp;');
    }.bind(this));

    this.element.observe('click', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
      if (this.getContents() == '&nbsp;' && Prototype.Browser.Gecko) this.setContents('&nbsp;');
    }.bind(this));
    this.element.observe('mouseup', function(event) {
      Midas.fire('region:update', {region: this, name: this.name, event: event});
    }.bind(this));

    this.element.observe('keyup', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event, changed: true});
    }.bind(this));
    this.element.observe('keypress', function(event) {
      Midas.fire('region:update', {region: this, name: this.name, event: event});

      switch(event.keyCode) {
        case 9: // tab
          this.selections.each(function(selection) {
            var container = selection.commonAncestorContainer;
            if (container.nodeType == 3) container = container.parentNode;
            if (container.tagName == 'LI' || container.up('li')) {
              event.stop();
              this.handleAction('indent');
            }
          }.bind(this));
          break;
        case 13: // enter
          break;
      }

    }.bind(this));

    // selection tracking
    this.element.observe('keyup', function() {
      this.updateSelections();
    }.bind(this));
    this.element.observe('mousedown', function() {
      this.selecting = true;
    }.bind(this));
    Event.observe(document, 'mouseup', function() {
      if (!this.selecting) return;
      this.selecting = false;
      this.updateSelections();
    }.bind(this));
  },

  setContents: function(content) {
    this.element.innerHTML = content;
  },

  getContents: function() {
    return this.element.innerHTML.replace(/^\s+|\s+$/g, "");
  },

  updateSelections: function() {
    var selection = window.getSelection();
    this.selections = [];

    for (var i = 0; i <= selection.rangeCount - 1; ++i) {
      var range = selection.getRangeAt(i);

      if (range.commonAncestorContainer == this.element ||
          Element.descendantOf(range.commonAncestorContainer, this.element)) {
        this.selections.push(range);
      }
    }
  },

  execCommand: function(action, argument) {
    argument = typeof(argument) == 'undefined' ? null : argument;
    
    var supported = document.execCommand('styleWithCSS', false, false);
    var handled;
    try {
      handled = document.execCommand(action, false, argument);
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
          this.handle[behavior].apply(this, Object.isArray(behaviors[behavior]) ? behaviors[behavior] : [behaviors[behavior]]);

          var sel = window.getSelection();
          this.selections.each(function(selection) {
            sel.removeRange(selection);
            sel.addRange(selection);
          })
        } else {
          throw('Unknown behavior method "' + behavior + '"');
        }
      }
    } else {
      switch (action) {
        case 'removeformatting':
          this.handle['insertHTML'].call(this, function() {
            return (this.selections[0]) ? this.selections[0].cloneContents().textContent : '';
          });
          break;
        default: this.execCommand(action, options['value']);
      }
    }
  },

  handle: {

    insertHTML: function(callback) {
      this.execCommand('insertHTML', callback.call(this))
    },

    execCommand: function(action, argument) {
      this.execCommand(action, argument);
    }

  }
});
