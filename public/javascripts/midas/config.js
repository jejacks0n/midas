Midas.Config = {

  /* The stylesheet to load for the skin of the toolbar/editable regions.
   */
  stylesheet: '/stylesheets/midas.css',

  /* Toolbars
   *
   * Any object you put in here will create a new toolbar.
   *
   * button format: [label, description, [type, action], [type, action], etc]
   * type can be:
   *   'button' (default) calls handleCommand and passes the key of the object (eg. save, preview, undo etc.)
   *   'toggle' will toggle on or off when clicked (and otherwise behaves like a button)
   *   'dialog' will open a dialog window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'panel' will open a panel dialog, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'palette' will open a palette window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'select' will open a select/pulldown style window, expects the action to be:
   *     a string url
   *     a function that returns a string url
   *   'context' will call a callback function, expects the action to be:
   *     a function that returns a boolean to highlight the button or not
   *     note: if a function isn't provided, the key will be passed to the
   *           contextHandler (eg. backcolor, bold, etc.), in which case a
   *           default context will be used (there are several defined in
   *           Midas.Toolbar.contexts).
   *   'mode' will toggle a given mode in the editor, expects the action to be:
   *     a string, denoting the name of the mode
   *     note: if a string isn't provided, the key will be passed to the
   *           modeHandler (eg. preview, html, etc.)
   *     note: it's assumed that when a specific "mode" is turned on, all other "modes" will be
   *           turned off (this happens automatically), thus putting the editor into a specific
   *           "state".
   *
   * If a button is an object (not an array, not a string), it's assumed that it's a button group,
   * all of it's children will be expected to be buttons or button groups.  A button group is
   * wrapped within a div for styling.  It's important to note that each of the keys, regardless of
   * if it's in a group or not needs to be unique.
   *
   * The save action is special, in that it's handled by Midas directly, all other actions are
   * handled by Midas.Region.
   *
   * Separators are any "button" that's not an array, and are expected to be a string.  You can use
   * three different separator styles: line, spacer, and flex spacer.
   * '-' = line
   * ' ' = spacer
   * '*' = flex spacer
   */
  toolbars: {
    actions: {
      save:                  ['Save', 'Save this page'],
      preview:               ['Preview', 'Preview this page', ['toggle'], ['mode']],
      sep1:                  ' ',
      undoredo:              {
        undo:                ['Undo', 'Undo your last action'],
        redo:                ['Redo', 'Redo your last action'],
        sep2:                ' '
        },
      insert:                {
        insertlink:          ['Link', 'Insert a hyperlink', ['dialog', '/midas/link']],
        insertmedia:         ['Media', 'Insert media', ['dialog', '/midas/media']],
        inserttable:         ['Table', 'Insert a table', ['dialog', '/midas/table']],
        insertobject:        ['Object', 'Insert an object (form, widget, etc)', ['dialog', '/midas/object']],
        insertcharacter:     ['Character', 'Insert special characters', ['dialog', '/midas/character']],
        sep3:                '*'
        },
      inspector:             {
        inspectorpanel:      ['Inspector', 'Open the element inspector panel', ['panel', '/midas/inspector.html']],
        sep3:                '*'
        },
      notespanel:            ['Notes', 'Open the page notes panel', ['toggle'], ['panel', '/midas/notes.html']],
      historypanel:          ['History', 'Open the page history panel', ['toggle'], ['panel', '/midas/history.html']]
      },
    htmleditor: {
      style:                 ['Style', '', ['select', '/midas/style.html']],
      formatblock:           ['Block Format', '', ['select', '/midas/formatblock.html']],
      sep1:                  '-',
      //backcolor:             ['Background Color', '', ['palette', '/midas/backcolor.html'], ['context']],
      forecolor:             ['Text Color', '', ['palette', '/midas/forecolor.html'], ['context']],
      sep2:                  '-',
      decoration:            {
        bold:                ['Bold', '', ['context']],
        italic:              ['Italicize', '', ['context']],
        //overline:            ['Overline', '', ['context']],
        strikethrough:       ['Strikethrough', '', ['context']],
        underline:           ['Underline', '', ['context']],
        sep:                 '-'
        },
      script:                {
        subscript:           ['Subscript', '', ['context']],
        superscript:         ['Superscript', '', ['context']],
        sep:                 '-'
        },
      justify:               {
        justifyleft:         ['Align Left', '', ['context']],
        justifycenter:       ['Center', '', ['context']],
        justifyright:        ['Align Right', '', ['context']],
        justifyfull:         ['Justify Full', '', ['context']],
        sep:                 '-'
        },
      list:                  {
        insertunorderedlist: ['Unordered List', '', ['context']],
        insertorderedlist:   ['Numbered List', '', ['context']],
        sep:                 '-'
        },
      indent:                {
        outdent:             ['Decrease Indentation', ''],
        indent:              ['Increase Indentation', ''],
        sep:                 '-'
        },
      //table:                 {
      //  insertrowbefore:     ['Insert Row', 'Insert a table row before'],
      //  insertrowafter:      ['Insert Row', 'Insert a table row after'],
      //  deleterow:           ['Delete Row', 'Delete this table row'],
      //  insertcolumnbefore:  ['Insert Column', 'Insert a table column before'],
      //  insertcolumnafter:   ['Insert Column', 'Insert a table column after'],
      //  deletecolumn:        ['Delete Column', 'Delete this table column'],
      //  sep:                 '-'
      //  },
      breaks:                {
        horizontalrule:      ['Horizontal Rule', ''],
        sep:                 '-'
        },
      removeformatting:      ['Remove Formatting', ''],
      html:                  ['Edit HTML', '', ['dialog', '/midas/html']]
      }
    },

  /* Behaviors
   *
   * Behaviors are used to change the default behaviors of the editor when a given button is
   * clicked.  For example, we prefer to add HR tags using an HR wrapped within a div with a
   * classname of hr, which allows for more flexible styling.  To add your own complex
   * behaviors just prototype them onto Midas.Region.handle.
   *
   * An example behavior would be to add a new button, called buynowbutton, and providing a
   * behavior like:
   *
   * buynowbutton: {insertElement: function() {
   *   return new Element('a', {href: '/buy-now', class: 'buy-now'}).update('Buy Now!');
   * }}
   *
   * It's important to note that the this keyword inside of the callback functions applies to an
   * instance of Midas.Region.
   *
   * Behavior Methods, and expected arguments (arguments can be provided in an array when there
   * is more than one expected):
   *   execCommand: a string of the action to take, or an array [action to take, argument]
   *   insertHTML: a callback function that returns a string
   *   ...
   */
  behaviors: {
    horizontalrule:      {insertHTML: function() {
                            return '<div class="hr"><hr/></div>';
                         }}
    }
};
