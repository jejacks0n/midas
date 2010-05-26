Midas.Config = {

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
   *     an array
   *     a function that returns an array
   *   'context' will call a callback function, expects the action to be:
   *     a function that returns a boolean to highlight the button or not (examples below)
   *     note: if a function isn't provided, the key will be passed to the
   *           contextHandler (eg. backcolor, bold, etc.)
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
   */
  toolbars: {
    actions: {
      save:                  ['Save', 'Save this page'],
      preview:               ['Preview', 'Preview this page', ['toggle'], ['mode']],
      sep1:                  ' ',
      undo:                  ['Undo', 'Undo your last action'],
      redo:                  ['Redo', 'Redo your last action'],
      sep2:                  ' ',
      insertlink:            ['Link', 'Insert a hyperlink', ['dialog', '/midas/link']],
      insertmedia:           ['Media', 'Insert media', ['dialog', '/midas/media']],
      inserttable:           ['Table', 'Insert a table', ['dialog', '/midas/table']],
      insertobject:          ['Object', 'Insert an object (form, widget, etc)', ['dialog', '/midas/object']],
      insertentity:          ['Characters', 'Insert special characters', ['dialog', '/midas/character']],
      inspector:             ['Inspector', 'Open the element inspector', ['panel', '/midas/inspector']],
      sep3:                  '*',
      notes:                 ['Notes', 'Open the page notes', ['panel', '/midas/notes']]
      },
    buttons: {
      style:                 ['Style', '', ['select', function() { return Midas.Config.styles }]],
      formatblock:           ['Block Format', '', ['select', function() { return Midas.Config.blocks }]],
      sep1:                  '-',
      backcolor:             ['Background Color', '', ['palette', '/midas/backcolor'], ['context']],
      forecolor:             ['Text Color', '', ['palette', '/midas/forecolor'], ['context']],
      sep2:                  '-',
      clipboard:             {
        cut:                 ['Cut', ''], // this button will only show if the browser can execute it
        copy:                ['Copy', ''], // this button will only show if the browser can execute it
        paste:               ['Paste', ''], // this button will only show if the browser can execute it
        sep:                 '-'
        },
      decoration:            {
        bold:                ['Bold', '', ['context']],
        italic:              ['Italicize', '', ['context']],
        overline:            ['Overline', '', ['context']],
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
        insertorderedlist:   ['Numbered List', '', ['context']],
        insertunorderedlist: ['Unordered List', '', ['context']],
        sep:                 '-'
        },
      indent:                {
        outdent:             ['Decrease Indentation', ''],
        indent:              ['Increase Indentation', ''],
        sep:                 '-'
        },
      breaks:                {
        horizontalrule:      ['Horizontal Rule', ''],
        pagebreak:           ['Page Break (printing)', ''], // style="page-break-after:always"
        sep:                 '-'
        },
      removeformatting:      ['Remove Formatting', ''],
      html:                  ['Edit HTML', '', ['dialog', '/midas/html'], ['mode']]
      }
    },

  /* Behaviors are used to change the default behaviors of the editor when a given button is
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
   *   insertElement: a callback function that returns an html node object
   *   insertHTML: a callback function that returns a string
   *   ...
   */
  behaviors: {
    horizontalrule:      {insertElement: function() {
                           return new Element('div', {
                             'class': 'hr'
                           }).update('<hr/>');
                         }},
    pagebreak:           {insertElement: function() {
                           return new Element('div', {
                             'class': 'midas-page-break',
                             style: 'page-break-after:always'
                           });
                         }}
    
//    bold:                {classname: 'bold'},
//    overline:            {style: {'text-decoration': 'overline'}}
    },

  /* CSS Classes that can be inserted using the toolbar
   * -- will wrap selections in spans with a classname of whatever is selected
   */
  styles: [
    ['red',  'Red text'],
    ['bold', 'Large bold text'],
    ['blue', 'Blue background']
    ],

  /* Block elements that can be inserted using the toolbar
   * -- will wrap selections in selected element
   */
  blocks: [
    ['<h1>', 'Heading 1 &lt;h1&gt;'],
    ['<h2>', 'Heading 2 &lt;h2&gt;'],
    ['<h3>', 'Heading 3 &lt;h3&gt;'],
    ['<h4>', 'Heading 4 &lt;h4&gt;'],
    ['<h5>', 'Heading 5 &lt;h5&gt;'],
    ['<h6>', 'Heading 6 &lt;h6&gt;'],
    ['<p>',  'Paragraph'],
    ['<blockquote>', 'Blockquote &lt;blockquote&gt;']
    ['<pre>', 'Formatted &lt;pre&gt;']
    ]

};
