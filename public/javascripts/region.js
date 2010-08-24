if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {
    inline: false,
    configuration: null,
    contentWindow: window
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
    this.doc.execCommand('enableInlineTableEditing', false, false);
  },

  setupObservers: function() {
    Event.observe(document, 'mouseup', function() {
      if (!this.selecting) return;
      this.selecting = false;
      this.updateSelections();
    }.bind(this));

    Event.observe(this.element, 'focus', function(e) {
      this.focused = true;
      if (this.previewing) return;
      Midas.fire('region', {region: this, name: this.name, event: e});
      if (this.getContents() == '&nbsp;' && Prototype.Browser.Gecko) this.setContents('&nbsp;');
    }.bind(this));
    Event.observe(this.element, 'blur', function(e) {
      this.focused = false;
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

          // read ignore classes and skip if this anchor has any of them
          for (var i = 0; i < this.configuration['ignoredLinks']; i += 1) {
            if (element.hasClassName(this.configuration['ignoredLinks'][i])) return;
          }

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

    // possible:drop custom event
    if (Prototype.Browser.WebKit) {
      // we have to do this because webkit doesn't fire the drop event unless both
      // dragover and dragstart default behaviors are canceled... but when we do
      // that and observe the drop event, the default behavior isn't handled (eg,
      // putting the image where I've dropped it).. so to allow the browser to do
      // it's thing, and also do our thing we have this little hack.  *sigh*
      // read: http://www.quirksmode.org/blog/archives/2009/09/the_html5_drag.html
      Event.observe(this.element, 'dragover', function(e) {
        if (this.__dropTimeout) return;
        this.__dropTimeout = setTimeout(function() {
          this.__dropTimeout = null;
          Event.fire(this.element, 'possible:drop');
        }.bind(this), 100);
      }.bind(this));
    } else {
      Event.observe(this.element, 'drop', function(e) {
        setTimeout(function() {
          Event.fire(this.element, 'possible:drop');
        }.bind(this), 1);
      }.bind(this));
    }

    Event.observe(this.element, 'keydown', function(e) {
      this.updateSelections();
      if (Midas.modal.showing && e.keyCode != 27) e.stop();

      switch (e.keyCode) {
        case 90: // undo and redo
          if (!e.metaKey) break;
          this.execCommand((e.shiftKey) ? 'redo' : 'undo');
          e.stop();
          break;
        case 9: // tab
          this.selections.each(function(selection) {
            var container = selection.commonAncestorContainer;
            if (container.nodeType == 3) container = container.parentNode;

            if (container.tagName == 'LI' || container.up('li')) {
              this.handleAction('indent');
              e.stop();
              return false;
            }

            if (container.up('table')) {
              var thisCell = (container.tagName == 'TD' || container.tagName == 'TH') ? container : container.up('th, td');
              var thisRow = thisCell.up();
              var nextCellInRow = thisCell.nextSiblings()[0];
              Element.writeAttribute(thisRow, '_midas_current_row', 'true');

              var tableRows = Element.up(thisRow, 'table').descendants('tr');

              var rowIndex;
              tableRows.each(function(row, i) {
                if (row.readAttribute('_midas_current_row') == 'true') {
                  row.removeAttribute('_midas_current_row');
                  rowIndex = i;
                }
              });

              var nextRow = (rowIndex < tableRows.length) ? tableRows[rowIndex + 1] : false;
              if (nextCellInRow) {
                this.selectNextCell(nextCellInRow, 0);
                e.stop();
              } else if (nextRow) {
                this.selectNextCell(Element.down(nextRow, 'td, th'));
                e.stop();
              }
              return false;

            }
          }.bind(this));
          break;
      }
    }.bind(this));

    Event.observe(this.element, 'keyup', function(e) {
      if (this.previewing) return;
      this.updateSelections();
      Midas.fire('region:update', {region: this, name: this.name, event: e, changed: true});
    }.bind(this));
    Event.observe(this.element, 'keypress', function(e) {
      if (this.previewing) return;
      Midas.fire('region:update', {region: this, name: this.name, event: e});

      if (e.metaKey && this.focused) {
        switch (e.charCode) {
          case 98:
            this.handleAction('bold');
            e.stop();
            break;
          case 105:
            this.handleAction('italic');
            e.stop();
            break;
          case 117:
            this.handleAction('underline');
            e.stop();
            break;
        }
      }

      switch (e.keyCode) {
        case 13: // enter
          if (Prototype.Browser.Gecko && this.element.tagName != 'DIV') {
            this.execCommand('insertHTML', '<br/>');
            e.stop();
          }
          break;
      }
    }.bind(this));
  },

  selectNextCell: function(cell) {
    var selection = this.options['contentWindow'].getSelection();
    selection.removeAllRanges();
    var range = this.doc.createRange();
    range.selectNodeContents(cell);
    range.collapse(true);
    selection.addRange(range);
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
    beforeHtml = beforeHtml.replace(/^\<br\>/, "");
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

    return temp.textContent.escapeHTML().
                            replace(/\n\n/g, '<br/>').
                            replace(/.*<!--.*-->/g, '').
                            replace(/^(<br\/>)+|(<br\/>\s*)+$/g, '');
  },

  selectNode: function(element) {
    var selection = this.options['contentWindow'].getSelection();
    selection.removeAllRanges();
    var range = this.doc.createRange();
    range.selectNode(element);
    selection.addRange(range);
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
    if (!handled && supported && action != 'undo' && action != 'redo') throw('Unknown action "' + action + '"');
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
      Midas.trace('Midas.Region.handleAction', action, options);
      if (this.defaultActions[action]) {
        this.defaultActions[action].call(this, options);
      } else {
        this.execCommand(action, options['value']);
      }
    }
  },

  wrap: function(tagName, newElementCallback, updateElementCallback) {
    this.updateSelections();
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

  defaultActions: {

    removeformatting: function(options) {
      this.execCommand('insertHTML', this.selections[0].cloneContents().textContent);
    },

    style: function(options) {
      this.wrap('span', function() {
        return new Element('span', {'class': options['value']});
      }, function(element) {
        element.addClassName(options['value']);
      });
    },

    backcolor: function(options) {
      this.wrap('font', function() {
        return new Element('font', {style: 'background-color:' + options['value']});
      }, function(element) {
        element.setStyle('background-color:' + options['value']);
      });
    },

    overline: function(options) {
      this.wrap('span', function() {
        return new Element('span', {style: 'text-decoration:overline'});
      }, function(element) {
        element.setStyle('text-decoration:overline');
      });
    },

    replaceHTML: function(options) {
      var selection = this.options['contentWindow'].getSelection();
      var range = this.doc.createRange();
      range.selectNodeContents(this.element);
      selection.addRange(range);
      this.execCommand('insertHTML', options['value']);
    },

    replaceNode: function(options) {
      if (options['node']) this.selectNode(options['node']);
      this.execCommand('insertHTML', options['value']);
    },
    
    insertrowafter: function(options) {
      this.defaultActions['insertRow'].call(this, options, 'after');
    },

    insertrowbefore: function(options) {
      this.defaultActions['insertRow'].call(this, options, 'before');
    },

    insertRow: function(options, position) {
      var selection = this.options['contentWindow'].getSelection();
      var range = selection.getRangeAt(0);
      if (!range) return;

      var node = range.commonAncestorContainer;
      var baseCell = node.tagName == 'TH' || node.tagName == 'TD' ? node : Element.up(node, 'td, th');
      if (!baseCell) return;

      var baseRow = Element.up(baseCell, 'tr');
      var baseContainer = Element.up(baseRow, 'thead, tbody, tfoot, table');
      var baseTable = Element.up(baseRow, 'table');

      // TODO: math is wrong for the following two lines -- we need to handle colspan and rowspan
      var matrix = {x: Element.previousSiblings(baseCell).length, y: Element.previousSiblings(baseRow).length};
      var columnCount = Element.siblings(baseCell).length + 1;

      var newRange = this.doc.createRange();
      newRange.selectNode(baseTable);
      var fragment = newRange.cloneContents();

      var container = new Element('div');
      container.appendChild(fragment);

      var table = Element.down(container, 'table');
      var row = Element.down(table, baseContainer.tagName + ' tr', matrix.y);
      var cell = Element.down(row, baseCell.tagName, matrix.x);

      var args = {};
      args[position] = '<tr _midas_dirty="true">' + ('<' + baseCell.tagName + '></' + baseCell.tagName + '>').repeat(columnCount) + '</tr>';
      Element.insert(row, args);

      var scrollPosition = this.doc.viewport.getScrollOffsets();

      selection.addRange(newRange);
      this.execCommand('insertHTML', container.innerHTML + ' ');
      selection.removeAllRanges();

      var finalRange = this.doc.createRange();
      var selectNode = this.element.down('tr[_midas_dirty=true] ' + baseCell.tagName);
      selectNode.up('tr').removeAttribute('_midas_dirty');
      finalRange.selectNodeContents(selectNode);
      finalRange.collapse(true);
      selection.addRange(finalRange);

      this.options['contentWindow'].scroll(scrollPosition.left, scrollPosition.top);
    },

    deleterow: function(options) {
      var selection = this.options['contentWindow'].getSelection();
      var range = selection.getRangeAt(0);
      if (!range) return;

      var node = range.commonAncestorContainer;
      var baseCell = node.tagName == 'TH' || node.tagName == 'TD' ? node : Element.up(node, 'td, th');
      if (!baseCell) return;

      var baseRow = Element.up(baseCell, 'tr');
      var baseContainer = Element.up(baseRow, 'thead, tbody, tfoot, table');
      var baseTable = Element.up(baseRow, 'table');

      // TODO: math is wrong for the following two lines -- we need to handle colspan and rowspan
      var matrix = {x: Element.previousSiblings(baseCell).length, y: Element.previousSiblings(baseRow).length};

      var newRange = this.doc.createRange();
      newRange.selectNode(baseTable);
      var fragment = newRange.cloneContents();

      var container = new Element('div');
      container.appendChild(fragment);

      var table = Element.down(container, 'table');
      var row = Element.down(table, baseContainer.tagName + ' tr', matrix.y);
      var nextRow = Element.nextSiblings(row)[0] || Element.previousSiblings(row)[0];
      if (!nextRow) return;

      Element.writeAttribute(nextRow, '_midas_dirty', 'true');
      Element.remove(row);

      var scrollPosition = this.doc.viewport.getScrollOffsets();

      selection.addRange(newRange);
      this.execCommand('insertHTML', container.innerHTML + ' ');
      selection.removeAllRanges();

      var finalRange = this.doc.createRange();
      var selectNode = this.element.down('tr[_midas_dirty=true] ' + baseCell.tagName);
      selectNode.up('tr').removeAttribute('_midas_dirty');
      finalRange.selectNodeContents(selectNode);
      finalRange.collapse(true);
      selection.addRange(finalRange);

      this.options['contentWindow'].scroll(scrollPosition.left, scrollPosition.top);
    },

    insertcolumnbefore: function(options) {
      this.defaultActions['insertColumn'].call(this, options, 'before');
    },

    insertcolumnafter: function(options) {
      this.defaultActions['insertColumn'].call(this, options, 'after');
    },

    insertColumn: function(options, position) {
      var selection = this.options['contentWindow'].getSelection();
      var range = selection.getRangeAt(0);
      if (!range) return;

      var node = range.commonAncestorContainer;
      var baseCell = node.tagName == 'TH' || node.tagName == 'TD' ? node : Element.up(node, 'td, th');
      if (!baseCell) return;

      var baseRow = Element.up(baseCell, 'tr');
      var baseContainer = Element.up(baseRow, 'thead, tbody, tfoot, table');
      var baseTable = Element.up(baseRow, 'table');

      // TODO: math is wrong for the following two lines -- we need to handle colspan and rowspan
      var matrix = {x: Element.previousSiblings(baseCell).length, y: Element.previousSiblings(baseRow).length};

      var newRange = this.doc.createRange();
      newRange.selectNode(baseTable);
      var fragment = newRange.cloneContents();

      var container = new Element('div');
      container.appendChild(fragment);

      var table = Element.down(container, 'table');
      var row = Element.down(table, baseContainer.tagName + ' tr', matrix.y);
      var cell = Element.down(row, 'td, th', matrix.x);
      Element.writeAttribute(cell, '_midas_dirty', 'true');

      Element.select(table, 'tr').each(function(tr) {
        var cell = Element.down(tr, 'td, th', matrix.x);

        var args = {};
        args[position] = new Element(cell.tagName);
        Element.insert(cell, args);
      });

      var scrollPosition = this.doc.viewport.getScrollOffsets();

      selection.addRange(newRange);
      this.execCommand('insertHTML', container.innerHTML + ' ');
      selection.removeAllRanges();

      var finalRange = this.doc.createRange();
      var selectNode = this.element.down(baseCell.tagName + '[_midas_dirty=true]');
      finalRange.selectNodeContents(selectNode);
      finalRange.collapse(true);
      selection.addRange(finalRange);

      this.options['contentWindow'].scroll(scrollPosition.left, scrollPosition.top);
    },

    deletecolumn: function(options) {
      var selection = this.options['contentWindow'].getSelection();
      var range = selection.getRangeAt(0);
      if (!range) return;

      var node = range.commonAncestorContainer;
      var baseCell = node.tagName == 'TH' || node.tagName == 'TD' ? node : Element.up(node, 'td, th');
      if (!baseCell) return;

      var baseRow = Element.up(baseCell, 'tr');
      var baseContainer = Element.up(baseRow, 'thead, tbody, tfoot, table');
      var baseTable = Element.up(baseRow, 'table');

      // TODO: math is wrong for the following two lines -- we need to handle colspan and rowspan
      var matrix = {x: Element.previousSiblings(baseCell).length, y: Element.previousSiblings(baseRow).length};

      var newRange = this.doc.createRange();
      newRange.selectNode(baseTable);
      var fragment = newRange.cloneContents();

      var container = new Element('div');
      container.appendChild(fragment);

      var table = Element.down(container, 'table');
      var row = Element.down(table, baseContainer.tagName + ' tr', matrix.y);
      var cell = Element.down(row, baseCell.tagName, matrix.x);
      var nextCell = Element.nextSiblings(cell)[0] || Element.previousSiblings(cell)[0];
      if (!nextCell) return;

      Element.writeAttribute(nextCell, '_midas_dirty', 'true');
      Element.select(table, 'tr').each(function(tr) {
        Element.down(tr, 'td, th', matrix.x).remove();
      });

      var scrollPosition = this.doc.viewport.getScrollOffsets();

      selection.addRange(newRange);
      this.execCommand('insertHTML', container.innerHTML + ' ');
      selection.removeAllRanges();

      var finalRange = this.doc.createRange();
      var selectNode = this.element.down(baseCell.tagName + '[_midas_dirty=true]');
      selectNode.removeAttribute('_midas_dirty');
      finalRange.selectNodeContents(selectNode);
      finalRange.collapse();
      selection.addRange(finalRange);

      this.options['contentWindow'].scroll(scrollPosition.left, scrollPosition.top);
    }

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
