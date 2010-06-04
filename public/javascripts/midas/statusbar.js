if (!Midas) var Midas = {};
Midas.Statusbar = Class.create({
  version: 0.2,
  options: {
    appendTo: null,
    configuration: null,
    panels: ['Path']
  },

  initialize: function(options) {
    if (!Midas.version) throw('Midas.Statusbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);
    this.options['configuration'] = this.options['configuration'] || Midas.Config;
    this.config = this.options['configuration'];

    this.build();
  },

  build: function() {
    this.element = new Element('div', {'class': 'midas-statusbar'});

    this.options.panels.each(function(method) {
      this.element.innerHTML += this['insert' + method].call(this);
    }.bind(this));

    ($(this.options['appendTo']) || document.body).appendChild(this.element);
  },

  update: function(region, event) {
    setTimeout(function() {
      this.element.innerHTML = '';
      this.options.panels.each(function(method) {
        this['insert' + method].call(this, region, event);
      }.bind(this));
    }.bind(this), 1);
  },

  destroy: function() {
    this.element.remove();
  },

  insertPath: function(region, event) {
    if (!event) return '<span><strong>Path:</strong></span>';
    
    var selection = window.getSelection();
    if (!selection.rangeCount) return;
    var range = selection.getRangeAt(0);

    var path = '';
    var node = range.commonAncestorContainer;
    node = node.nodeType == 3 ? Element.up(node) : node;
    this.path = [];

    if (node != region.element && Element.descendantOf(node, region.element)) {
      this.path = Element.ancestors(node);

      var length = this.path.length - 1;
      for (var i = 0; i <= length; ++i) {
        if (this.path[i] == region.element) break;
        path = '<a>' + this.path[i].tagName.toLowerCase() + '</a> &raquo; ' + path;
      }
      path += '<a>' + node.tagName.toLowerCase() + '</a>';
      this.path[-1] = node;
    }

    var element = new Element('span').update('<strong>Path:</strong> ' + path);
    element.observe('click', function(event) {
      var index = Element.nextSiblings(Event.element(event)).length;
      var selection = window.getSelection();
      var range = document.createRange();
      range.selectNode(this.path[index - 1]);
      selection.removeAllRanges();
      selection.addRange(range);
    }.bindAsEventListener(this));

    this.element.appendChild(element);
  }
});