var Midas = Class.create({
  version: 0.2,
  options: {
    classname: 'editable',
    saveUrl: window.location.href,
    saveMethod: 'put'
  },

  initialize: function(options, toolbarOptions, regionOptions) {
    this.options = Object.extend(Object.clone(this.options), options);

    this.toolbar = new Midas.Toolbar(toolbarOptions);

    this.regions = [];
    this.regionElements = $$('div.' + this.options['classname']);
    this.regionElements.each(function(element) {
      this.regions.push(new Midas.Region(element, regionOptions));
    }.bind(this));
  },

  serialize: function() {
    var serialized = {};
    this.regions.each(function(region) {
      var value = region.serialize();
      serialized[value.name] = value.content;
    });
    return serialized;
  },

  save: function() {
    var method = this.options.saveMethod;
    var parameters = {};
    if (method.toUpperCase() != 'POST' && method.toUpperCase() != 'GET') {
      parameters['_method'] = method;
    }

    new Ajax.Request(this.options.saveUrl, {
      method: method,
      parameters: Object.extend(parameters, this.serialize())
    });
  },

  destroy: function() {
    this.toolbar.destroy();
    this.regions.each(function(region) {
      region.destroy();
    });
  }
});

// Midas static methods
Object.extend(Midas, {
  version: 0.2,

  agent: function() {
    if (this.agentId) return this.agentId;

    var agent = navigator.userAgent.toLowerCase();

    var name = null;
    if ((agent.indexOf("msie") != -1) && (agent.indexOf("opera") == -1) && (agent.indexOf("webtv") == -1)) {
      name = 'msie';
    } else if (agent.indexOf("opera") != -1) {
      name = 'opera';
    } else if (agent.indexOf("gecko") != -1) {
      name = 'gecko';
    } else if (agent.indexOf("safari") != -1) {
      name = 'safari';
    } else if (agent.indexOf("konqueror") != -1) {
      name = 'konqueror';
    }

    this.agentId = name;
    return name;
  },

  agentIsCapable: function() {
    var agent = Midas.agent();

    // TODO: IE is disabled at this point because it doesn't follow the w3c standards in regards to designMode.
    return (agent && document.getElementById && document.designMode && agent != 'konqueror' && agent != 'msie') ? true : false;
  }
});

if (!Midas) var Midas = {};
Midas.Region = Class.create({
  version: 0.2,
  name: null,
  options: {

  },

  initialize: function(element, options) {
    if (!Midas.version) throw ('Midas.Region requires Midas');

    this.element = $(element);
    if (!this.element || !Midas.agentIsCapable()) return;

    this.options = Object.extend(Object.clone(this.options), options);
    this.name = this.element.getAttribute('id');

    this.makeEditable();
  },

  makeEditable: function() {
    this.element.contentEditable = true;
  },

  setContents: function(content) {
    this.element.innerHTML = content;
  },

  getContents: function() {
    return this.element.innerHTML.replace(/^\s+|\s+$/g,"");
  },

  serialize: function() {
    return {name: this.name, content: this.getContents()}
  },

  destroy: function() {
    this.element.contentEditable = 'inherit';
  }
});

if (!Midas) var Midas = {};
Midas.Toolbar = Class.create({
  version: 0.2,
  options: {
    customToolbar: null
  },

  initialize: function(options) {
    if (!Midas.version) throw ('Midas.Toolbar requires Midas');

    this.options = Object.extend(Object.clone(this.options), options);

    this.build();
  },

  build: function() {
    var id = null;
    var element = '';
    while (element !== null) {
      id = 'midas_toolbar' + parseInt(Math.random() * 10000);
      element = $(id);
    }
    this.element = new Element('div', {id: id, classname: 'midas_toolbar'});

    var toolbar = '';
    toolbar = (this.options.customToolbar) ? '<div class="custom-toolbar">' + this.options.customToolbar + '</div>' : '';
    toolbar += '<div class="predefines-toolbar">';
//    doc.writeln('<select name="rta_styles" id="rta_styles_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'insertspan\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//    for (var i = 0; i < this.m_styles.length; i++) doc.writeln('<option value="' + this.m_styles[i][0] + '">' + this.m_styles[i][1] + '</option>');
//    doc.writeln('</select>');
//    doc.writeln('<select name="rta_blocks" id="rta_blocks_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'formatblock\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//    for (var i = 0; i < this.m_blocks.length; i++) doc.writeln('<option value="' + this.m_blocks[i][0] + '">' + this.m_blocks[i][1] + '</option>');
//    doc.writeln('</select>');
//    doc.writeln('<select name="rta_fonts" id="rta_fonts_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'fontname\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//    for (var i = 0; i < this.m_fonts.length; i++) doc.writeln('<option value="' + this.m_fonts[i][0] + '">' + this.m_fonts[i][1] + '</option>');
//    doc.writeln('</select>');
//    doc.writeln('<select name="rta_sizes" id="rta_sizes_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'fontsize\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//    for (var i = 0; i < this.m_sizes.length; i++) doc.writeln('<option value="' + this.m_sizes[i][0] + '">' + this.m_sizes[i][1] + '</option>');
//    doc.writeln('</select>');
    toolbar += '</div>';

    this.element.update(toolbar);
    document.body.appendChild(this.element);
  },

  destroy: function() {
    this.element.remove();
  }
});

if (!Midas) var Midas = {};
Midas.Dialog = Class.create({
  version: 0.2,

  initialize: function() {

  }
});

