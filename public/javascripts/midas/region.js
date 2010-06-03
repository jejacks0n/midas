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
    
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('enableInlineTableEditing', false, false);
  },

  setupObservers: function() {
    this.element.observe('focus', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
      if (this.getContents() == '&nbsp;') this.setContents('&nbsp;');
    }.bind(this));
    this.element.observe('blur', function(event) {
      Midas.fire('region:blur', {region: this, name: this.name, event: event});
    }.bind(this));

    this.element.observe('click', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
      if (this.getContents() == '&nbsp;') this.setContents('&nbsp;');
    }.bind(this));
    this.element.observe('mouseup', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
    }.bind(this));

    this.element.observe('keyup', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});
    });
    this.element.observe('keypress', function(event) {
      Midas.fire('region', {region: this, name: this.name, event: event});

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

//  getTextNodes: function(fragment, textnodes) {
//    textnodes = textnodes || [];
//    Element.cleanWhitespace(fragment);
//
//    for (var i = 0; i <= fragment.childNodes.length - 1; ++i) {
//      if (fragment.childNodes[i].nodeType == 3) {
//        textnodes.push(fragment.childNodes[i]);
//      } else {
//        this.getTextNodes(fragment.childNodes[i], textnodes);
//      }
//    }
//    return textnodes;
//  },

  execCommand: function(action, argument) {
    argument = typeof(argument) == 'undefined' ? null : argument;
    var supported = document.execCommand('styleWithCSS', false, false);
    document.execCommand('enableInlineTableEditing', false, false);
    var handled = document.execCommand(action, false, argument);
    if (!handled && supported) throw('Unknown action "' + action + '"');
  },

  serialize: function() {
    return {name: this.name, content: this.getContents()}
  },

  destroy: function() {
    this.element.contentEditable = 'false';
    this.element.removeClassName('midas-region');
  },

  handleAction: function(action, spec, event, toolbar) {
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
        case 'indent':
          var div = new Element('div');
          this.element.appendChild(div);
          this.execCommand('indent');
          this.element.removeChild(div);
          break;
        case 'removeformatting':
          this.handle['insertHTML'].call(this, function() {
            return (this.selections[0]) ? this.selections[0].cloneContents().textContent : '';
          });
          break;
        default: this.execCommand(action);
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

//    insertElement: function(callback) {
//      var element = callback.call(this);
//      this.selections.each(function(selection) {
//        selection.deleteContents();
//        selection.insertNode(element);
//        selection.selectNode(element);
//      });
//    },

//    classname: function(classname) {
//      this.selections.each(function(selection) {
//        var fragment = selection.cloneContents();
//        var textnodes = this.getTextNodes(fragment);
//
//        console.debug(selection);
//        console.debug(fragment);
//
//        // get the container node
//        // this should be prototyped on element/range for better testing
//        var container;
//        if (selection.commonAncestorContainer.nodeType == 3) { // common ancestor is a text node
//          container = selection.commonAncestorContainer.parentNode;
//        } else {
//          container = selection.commonAncestorContainer;
//        }
//
//        console.debug('container', container);
//
//        console.debug('container', container.childNodes);
//        console.debug('fragment', fragment.childNodes);
//
//        if (container != this.element) {
//          if (!container.childNodes.equals(fragment.childNodes)) {
//            // the node is not the fragment
//            if (fragment.childNodes.length == 1 && fragment.childNodes[0].nodeType != 3) {
//              // the fragment has one child and it's not a text node
//              console.debug('first node');
//              container = fragment.childNodes[0];
//              selection.deleteContents();
//              selection.insertNode(container);
//              selection.selectNode(container);
//            }
//          }
//          container.addClassName(classname)
//        } else {
//          // the nodes should be wrapped within one span
//          // ... and cleanup should be done
//          console.debug('new');
//          selection.surroundContents(new Element('span', {'class': classname}));
//        }
//
//        // selecting 's' in 'testing', should be: span
//        // selecting 'testing', should be: div
//        // selecting 'Ipsum...', should be: [region]
//        // selecting 'Ipsum... testing', should be: [region]
//        // selecting everything, should be: [region]
//        // selecting 'tr2td2', should be: td
//        // selecting the table cell containing 'tr2td2', should be: td
//        console.debug('container', container);
//
//        // bugs:
//        // if you select all of the cells in the table, and click italicize, and then bold.. ugh.
//
//
//
//
////        // figure out if we should add or remove
////        var count = 0;
////        textnodes.each(function(node) {
////          if (node.parentNode != fragment && Element.hasClassName(node.parentNode, classname)) count = count + 1;
////        });
////
////        if (count == 0 || count < textnodes.length - 1) {
////          // add
////          textnodes.each(function(node) {
////            console.debug(node, node.parentNode);
////            if (node.parentNode != fragment) {
////              Element.addClassName(node.parentNode, classname);
////            } else {
////              Element.wrap(node, new Element('span', {'class': classname}));
////            }
////          });
////        } else {
////          console.debug('remove');
////          // remove
////
////          // only remove span tags, if it doesn't have any attributes,
////          // otherwise remove the classname, and if the class attribute is empty remove that too
////
////          textnodes.each(function(node) {
////            if (node.parentNode != fragment) {
////              Element.removeClassName(node.parentNode, classname);
////            }
////          });
////        }
////
//      }.bind(this));
//    }
  }
});
