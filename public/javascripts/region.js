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
    Event.observe(this.element, 'blur', function(e) {
      if (this.previewing) return;
      Midas.fire('region:blur', {region: this, name: this.name, event: e});
    }.bind(this));

    Event.observe(this.element, 'paste', function(e) {
      if (Midas.modal.showing) e.stop();
      var html = this.element.innerHTML;
      if (Prototype.Browser.Gecko && this.element.tagName != 'DIV') {
        e.stop();
      } else {
        setTimeout(function() { this.afterPaste(html); }.bind(this), 1);
      }
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
          if (Prototype.Browser.Gecko && this.element.tagName != 'DIV') {
            this.execCommand('insertHTML', '<br/>');
            e.stop();
          }
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
        Midas.modal('/midas/modals/sanitizer.html', {
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
