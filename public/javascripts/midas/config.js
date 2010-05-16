
Midas.Config = {

  // Classes that can be inserted using the toolbar
  // -- will wrap selections in spans with a classname of whatever is selected
  classes: [
    ['red',  'Red text'],
    ['bold', 'Large bold text'],
    ['blue', 'Blue background']
    ],

  // Block elements that can be inserted using the toolbar
  // -- will wrap selections in selected element
  blocks: [
    ['<p>',  'Paragraph'],
    ['<h1>', 'Heading 1 &lt;h1&gt;'],
    ['<h2>', 'Heading 2 &lt;h2&gt;'],
    ['<h3>', 'Heading 3 &lt;h3&gt;'],
    ['<h4>', 'Heading 4 &lt;h4&gt;'],
    ['<h5>', 'Heading 5 &lt;h5&gt;'],
    ['<h6>', 'Heading 6 &lt;h6&gt;'],
    ['<pre>', 'Formatted &lt;pre&gt;']
    ],

  /* Toolbar buttons (save, preview, etc.)
   *
   * format: [label, tooltip description, type]
   * type can be:
   *   'button' (default) just calls handleCommand(key of the object, eg. save, preview, undo etc.)
   *   'toggle' will toggle on or off when clicked
   *   'dialog' will open a dialog window, expects the next array item to be a url
   *   'panel' will open a panel dialog, expects the next array item to be a url
   */
  toolbar: {
    save:              ['Save', 'Save this page'],
    preview:           ['Preview', 'Preview this page', 'toggle'],
    sep1:              ' ',
    undo:              ['Undo', 'Undo your last action'],
    redo:              ['Redo', 'Redo your last action'],
    sep2:              ' ',
    insert_link:       ['Link', 'Insert a hyperlink', 'dialog', '/midas/link'],
    insert_media:      ['Media', 'Insert media', 'dialog', '/midas/media'],
    insert_table:      ['Table', 'Insert a table', 'dialog', '/midas/table'],
    insert_object:     ['Object', 'Insert an object (form, widget, etc)', 'dialog', '/midas/object'],
    insert_entity:     ['Characters', 'Insert special characters', 'dialog', '/midas/character'],
    inspector:         ['Inspector', 'Open the element inspector', 'panel', '/midas/inspector'],
    sep3:              '*',
    notes:             ['Notes', 'Open the page notes', 'panel', '/midas/notes']
    },

  /* Edit buttons configuration (bold, italics, etc.)
   *
   * format: [label, type, var]
   * type can be:
   *   'button' (default) just calls handleCommand(key of the object, eg. cut, copy, bold etc.)
   *   'toggle' will toggle on or off when clicked
   *   'palette' will open a palette window, expects the next array item to be a url
   *   'select' will open a select/pulldown style window, expects the next array item to be an array
   *   'context' will call a callback function, expects the next array item to be a:
   *     function that returns a boolean to highlight the button or not (examples below)
   *     string that matches one of the following: bold, italic !!
   */
  buttonbar: {
    block:             ['Block Format', 'select', Midas.Config.blocks],
    sep1:              '-',
    backcolor:         ['Background Color', 'palette', 'backcolor'],
    forecolor:         ['Text Color', 'palette', 'forecolor'],
    sep2:              '-',
    clipboard:         {
      cut:             ['Cut'],
      copy:            ['Copy'],
      paste:           ['Paste'],
      sep:             '-'
      },
    decoration:        {
      bold:            ['Bold', 'context'],
      italic:          ['Italicize', 'context'],
      overline:        ['Overline', 'context'],
      strikethrough:   ['Strikethrough', 'context'],
      underline:       ['Underline', 'context'],
      sep:             '-'
      },
    script:            {
      subscript:       ['Subscript', 'context'],
      superscript:     ['Superscript', 'context'],
      sep:             '-'
      },
    justify:           {
      justifyleft:     ['Align Left', 'context'],
      justifycenter:   ['Center', 'context'],
      justifyright:    ['Align Right', 'context'],
      justifyfull:     ['Justify Full', 'context'],
      sep:             '-'
      },
    list:              {
      orderedlist:     ['Numbered List', 'context'],
      unorderedlist:   ['Unordered List', 'context'],
      sep:             '-'
      },
    indent:            {
      outdent:         ['Decrease Indentation'],
      indent:          ['Increase Indentation'],
      sep:             '-'
      },
    breaks:            {
      horizontalrule:  ['Horizontal Rule'],
      pagebreak:       ['Page Break (printing)'], // style="page-break-after:always"
      sep:             '-'
      },
    removeformatting:  ['Remove Formatting'],
    edithtml:          ['Edit HTML', 'toggle']
    }
};
