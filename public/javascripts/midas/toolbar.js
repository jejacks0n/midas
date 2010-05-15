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