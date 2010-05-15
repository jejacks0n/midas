/**
 * Client-side wysiwyg html editor (richtextarea) with standard
 * textarea fallback.
 *
 * Version 3.1
 *
 * Copyright 2003-2005 Technicode.  All Rights Reserved.  This software
 * is protected by U.S. copyright law and international copyright treaty.
 * This file is licensed for your use, but you may not redistribute it.
 * See copyright.txt for details.
 *
 * Based on technologies from Kevin Roths Cross-Browser Rich Text Editor
 * (found at http://www.kevinroth.com/rte/demo.htm).
 */

/*

possibly add more onblur handling so we can capture what's selected, do our thing and then select
it again... don't know how hard that would be but it needs to happen in IE if we expect frames to
ever work in it.

figure out where the carat is so we can tell what buttons need to be adjusted by working with the
Document Object Model.

figure out or write something that will generate better html when saved (removing all the bad and
empty html/tags) as well as formatting it correctly -- tidy is something to look into here.


//for (var a in e) alert(a + ":\n" + e[a]);
//return;

*/


var VIEW_SOURCE = 0;
var VIEW_PREVIEW = 1;


/**
 *
 */
function RichTextarea(includePath, debugMode)
{
	// get and define the parameters passed
	this.m_includePath = includePath;
	if (typeof(debugMode) == 'undefined') this.m_debugMode = false;
	else this.m_debugMode = debugMode;

	// figure out what user agent (browser) is being used so we can use it later to confirm if it's
	// got what it takes and also handle browser specific features or limitations
	var agent = navigator.userAgent.toLowerCase();
	this.m_isIE = ((agent.indexOf("msie") != -1) && (agent.indexOf("opera") == -1) && (agent.indexOf("webtv") == -1));
	this.m_isGecko = (agent.indexOf("gecko") != -1);
	this.m_isSafari = (agent.indexOf("safari") != -1);
	this.m_isKonqueror = (agent.indexOf("konqueror") != -1);

	// write the style sheet include tag (for the toolbar and editable regions)
	document.write('<link rel="STYLESHEET" type="text/css" href="/stylesheets/protoeditor.css">');

	// enable tracking of each instance of RichTextarea
	this.m_id = 'richtextarea' + (RichTextarea.idSeed++);
	RichTextarea.instances[this.m_id] = this;

	// load the configuration in such a way that it can be customized
	RichTextarea_loadCfg(this);

	// m_isContentEditable is set from the first call to _writeToolbar() and _writeRegion()
	this.m_isContentEditable = false;

	// m_toolbarCount stores the number of toolbars in this instance, and is added to with each
	// call to _writeToolbar()
	this.m_toolbarCount = 0;

	// this stores the toolbar that most recently was used
	this.m_toolbar = 0;

	// m_regions contains all the regions in this instance
	this.m_regions = new Object();
	this.m_regionCount = 0;

	// m_region is set after the first call to _writeRegion() and stores the currently active
	// region
	this.m_region = '';

	// m_stylesheet is set after the first call to _setupDocument()
	this.m_styleSheet = '';

	// m_doc is used throughout as a reference to the document containing the 'content' or regions
	// each instance must have all regions in one document, they can't span over more than one
	this.m_doc = null;
}


/**
 * Creates a toolbar as well as an editable region together, which can be better than calling them
 * seperatly because the toolbar will get the proper association with the editable region.  You
 * should use this function if you plan to have more than one toolbar and region on the page.
 *
 * doc should be window.document in most situations.
 * idName is the name of the form element you want to use (it's also used to generate the id).
 * fullMode allows you to specify between which toolbar mode to use -- which can be setup in
 * RichTextarea_loadCfg().
 * content is the content to be loaded into the region.
 * height is the height of the region, not including the toolbar (defaults to 200px if null).
 * width is the width of the region (defaults to 100% if null).
 * cssIncludes should be an array containing any number of css files, however remote css's can't
 *   be loaded in firefox/gecko.
 */
function _writeRichTextarea(doc, idName, mode, content, height, width, inheritCSS, baseUrl)
{
	if (mode !== false) this.writeToolbar(doc, mode, idName);
	this.writeRegion(doc, idName, content, height, width, inheritCSS, baseUrl);
}


/**
 * Creates the toolbar which can be placed anywhere on the page or alternately in a frame (IE
 * doesn't handle the frames well because it unselects anything selected in the editable region).
 *
 * doc should be window.document in most situations, but can be some other document if you like.
 * mode (int) allows you to specify between different toolbar modes which can be setup in
 *   RichTextarea_loadCfg().
 * idName (optional) can be passed where one region is used, and you want the region to get focus
 *   when the toolbar is clicked.
 */
function _writeToolbar(doc, mode, idName, extraControls)
{
	// figure out if the browser is designMode capable (safari and konqueror think they're
	// designMode capable but they aren't) -- this code is also located in _setupDocument()
	if (doc.getElementById && doc.designMode && !this.m_isSafari && !this.m_isKonqueror)
		this.m_isContentEditable = true;

	// if the user agent (browser) is able to handle editing then display the toolbar
	if (this.m_isContentEditable)
	{
		var onClick = '';
		if (typeof(idName) != 'undefined' && idName != '') onClick = 'RichTextarea.getInstance(\'' + this.m_id + '\')._onFocus(null, \'rta_' + idName + this.m_id + '\');';

		// write the div that contains the entire toolbar
		doc.writeln('<div id="rta_toolbar" onClick="' + onClick + '">');

		// write the predefines -- styles, block types, fonts, and sizes
		if (extraControls) doc.writeln('<div id="extra_controls' + ((mode >= 0) ? '' : '_notoolbar') + '">' + extraControls + '</div>');

		// only show this if the toolbar should be shown
		if (mode >= 0)
		{
			doc.writeln('<div id="predefines">');

			doc.writeln('<select name="rta_styles" id="rta_styles_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'insertspan\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
			for (var i = 0; i < this.m_styles.length; i++) doc.writeln('<option value="' + this.m_styles[i][0] + '">' + this.m_styles[i][1] + '</option>');
			doc.writeln('</select>');

			doc.writeln('<select name="rta_blocks" id="rta_blocks_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'formatblock\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
			for (var i = 0; i < this.m_blocks.length; i++) doc.writeln('<option value="' + this.m_blocks[i][0] + '">' + this.m_blocks[i][1] + '</option>');
			doc.writeln('</select>');

//			doc.writeln('<select name="rta_fonts" id="rta_fonts_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'fontname\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//			for (var i = 0; i < this.m_fonts.length; i++) doc.writeln('<option value="' + this.m_fonts[i][0] + '">' + this.m_fonts[i][1] + '</option>');
//			doc.writeln('</select>');

//			doc.writeln('<select name="rta_sizes" id="rta_sizes_' + this.m_id + this.m_toolbarCount + '" onChange="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').handleCommand(\'fontsize\', this.options[selectedIndex].value); this.selectedIndex = 0;">');
//			for (var i = 0; i < this.m_sizes.length; i++) doc.writeln('<option value="' + this.m_sizes[i][0] + '">' + this.m_sizes[i][1] + '</option>');
//			doc.writeln('</select>');

			doc.writeln('</div>');
		}

		// write the button toolbar
		if (mode >= 0)
		{
			doc.writeln('<div id="buttons">');
			for (var i = 0; i < this.m_buttons.length; i++)
			{
				var button = this.m_buttons[i];

				var but = '';
				if (button[0] == 0) but = '<img class="rta_sep" src="/images/protoeditor/seperator.gif" width="1">';
				else
				{
					but = '<img class="rta_button" id="rta_button_' + button[2] + this.m_id + this.m_toolbarCount + '" " src="/images/protoeditor/' + button[2] + '.gif" alt="' + button[3] + '" title="' + button[3] + '" ' +
					'onClick="' + onClick + 'RichTextarea.getInstance(\'' + this.m_id + '\').m_toolbar = ' + this.m_toolbarCount + ';RichTextarea.getInstance(\'' + this.m_id + '\').' + button[4] + ';' +
					((button[0] == 2) ? ' this.className = (this.className != \'rta_button_toggle\') ? \'rta_button_toggle\' : \'rta_button\';"' : '"') +
					((button[0] == 3) ? ' style="width:27px"' : '') + '>';
				}

				if (button[1] <= mode && button[1] != -1) doc.writeln(but);
			}
			doc.writeln('</div>');

			// write the palette dialogs, which will be hidden until the correct button is pressed
			for (var i = 0; i < this.m_palettes.length; i++)
			{
				var palette = this.m_palettes[i];
				doc.writeln('<iframe frameborder="0" id="rta_palette_' + palette[0] + this.m_id + this.m_toolbarCount + '" width="' + palette[2] + '" height="' + palette[3] + '" src="' + this.m_includePath + 'dialogs/' + palette[1] + '" scrolling="no" marginwidth="0" marginheight="0" style="visibility:hidden;margin:0;border:0;position:absolute;border:1px solid #cdcdcd;"></iframe>');
			}
		}

		// close the div that contains the entire toolbar
		doc.writeln('</div>');

		// write the debug div tag
		if (this.m_debugMode) doc.writeln('<div id="rta_debug_div" style="border:1px dotted red">debug:</div>');

		// add to the number of toolbars in this instance
		this.m_toolbarCount++;
	}

	if (mode < 0) return;

	// handle ie and gecko specific mouse events
	if (this.m_isIE)
	{
		doc.onmouseover = this._buttonOver;
		doc.onmouseout  = this._buttonOut;
		doc.onmouseup   = this._buttonOver;
		doc.onmousedown = this._buttonDown;
		doc.attachEvent('onmouseup', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._interfaceHandler(e);"));
	}
	else
	{
		doc.addEventListener('mouseup', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._interfaceHandler(e, null, " + this.m_toolbarCount + ");"), true);
	}

	// set the onbeforeunload event so we can check for changes
	if (mode == 2) window.onbeforeunload = rta_onBeforeUnload;
}


/**
 * Defines an area of the page that's content editable.
 */
function _writeRegion(doc, idName, content, height, width, inheritCSS, baseUrl)
{
	toolBar = this.m_toolbarCount - 1;

	// get the information from the containing document
	this._setupDocument(doc, inheritCSS);

	// set the default height and width
	if (!height) height = '200';
	if (!width || width == '100%') width = '100%';

	// write the iframe and make it editable, or fall back to a textarea if that's all we can do
	if (this.m_isContentEditable)
	{
		doc.writeln('<iframe frameborder="0" class="rta_editable_region" style="width:' + width + ';height:' + height + 'px;" id="rta_' + idName + this.m_id + '" name="rta_' + idName + '" src="about:blank" marginwidth="0" marginheight="0"></iframe>');
		this._enableDesignMode(idName, content, toolBar, baseUrl);
	}
	else
	{
		doc.writeln('<div><textarea name="rta_' + idName + this.m_id + '" id="rta_' + idName + this.m_id + '" style="width:' + width + ';height:' + height + ';">' + content + '</textarea></div>');
	}

	// update the form's onsubmit, so we can save our stuff
	this._updateFormOnSubmit(idName);

	// set the first region created to be the active one
	if (this.m_regionCount == 0) this.m_region = idName + this.m_id;

	// make the hidden field for form submission and the preview area
	doc.writeln('<textarea name="' + idName + '" id="rta_' + idName + this.m_id + '_hidden" style="display:none"></textarea>');
	doc.writeln('<div name="' + idName + '" id="rta_' + idName + this.m_id + '_preview" style="display:none"></div>');

	// add the region to the list of regions in this instance
	// array structure: source view, preview mode, [more to come]
	if (this.m_regionCount == 0) this.m_region = 'rta_' + idName + this.m_id;
	this.m_regions[idName + this.m_id] = new Array(false, false);
	this.m_regionCount++;
}


/**
 * Handles all the button and pulldown commands.
 */
function _handleCommand(cmd, option, button)
{
	if (typeof(option) == 'undefined') option = '';

	switch (cmd)
	{
		case 'commandsave':
			this.m_hasChanges = false;

			// create a new form element
			var body = this.m_doc.body;
			var form = body.appendChild(this.m_doc.createElement('FORM'));
			form.method = 'POST';
			form.action = '/update_page' + (window.location.pathname ? window.location.pathname : '');

			// go through each region, update the hidden field, and make a textarea in the form
			for (var r in this.m_regions)
			{
				this.updateField(r);

				// add the textarea to the form we just created
				var textarea = this.m_doc.createElement('TEXTAREA');
				//textarea.name = 'page[section_contents][' + r.replace(this.m_id, "") + "]";
        textarea.name = 'page[section_contents_attributes][][content]';
				textarea.value = this.m_doc.getElementById('rta_' + r + '_hidden').value;
				textarea.style.display = 'none';
				form.appendChild(textarea);

        var textarea1 = this.m_doc.createElement('TEXTAREA');
        //textarea.name = 'page[section_contents][' + r.replace(this.m_id, "") + "]";
        textarea1.name = 'page[section_contents_attributes][][region]';
        textarea1.value = r.replace(this.m_id, "");
        textarea1.style.display = 'none';
        form.appendChild(textarea1);
			}

			// submit the form
			form.submit();
			break;

		case 'commandpreview':
//      if (typeof(option) != 'string')
//      {
//        this._dialogPalette('preview' + this.m_id + this.m_toolbar, option);
//      }
//      else
//      {
//        this._dialogPalette('backcolor' + this.m_id + this.m_toolbar, button, true);
//      }
//      break;
//
			// loop through each region, update the hidden field, hide the editable area, and
			// show the real html
			for (var r in this.m_regions)
			{
				if (this.m_regions[r][VIEW_PREVIEW])
				{
					// hide the preview
					var preview = this.m_doc.getElementById('rta_' + r + '_preview');
					preview.innerHTML = '';
					preview.style.display = 'none';

					// display the editable region
					this.m_doc.getElementById('rta_' + r).style.display = 'block';

					this.m_regions[r][VIEW_PREVIEW] = false;
				}
				else
				{
					this.updateField(r);

					// hide the editable region
					this.m_doc.getElementById('rta_' + r).style.display = 'none';

					// fill the preview and display it
					var preview = this.m_doc.getElementById('rta_' + r + '_preview');
					preview.innerHTML = this.m_doc.getElementById('rta_' + r + '_hidden').value;
					preview.style.display = 'block';

					this.m_regions[r][VIEW_PREVIEW] = true;
				}
			}
			break;

		case 'actionbackcolor':
			if (typeof(option) != 'string')
			{
				this._dialogPalette('backcolor' + this.m_id + this.m_toolbar, option);
			}
			else
			{
 				this.handleCommand('insertHTML', '<span style="background-color:' + option + '">' + this.getSelected(this.m_region) + '</span>');

 				this._dialogPalette('backcolor' + this.m_id + this.m_toolbar, button, true);
			}
			break;

		case 'actionforecolor':
			if (typeof(option) != 'string') this._dialogPalette('forecolor' + this.m_id + this.m_toolbar, option);
			else
			{
				if (this.m_isGecko) this.handleCommand('forecolor', option);
				else this.handleCommand('insertHTML', '<span style="color:' + option + '">' + this.getSelected(this.m_region) + '</span>');

				this._dialogPalette('forecolor' + this.m_id + this.m_toolbar, button, true);
			}
			break;

    case 'inserthorizontalrulespecial': // inserts a custom hr tag
      this.handleCommand('insertHTML', '<div class="hr"><hr/></div>');
      break;

		case 'insertlink': // inserts an anchor tag
			if (!option) Modalbox.show('/protoeditor/link', {title: 'Insert Link', width: 600}); //this._dialogPopup(this.m_includePath + 'dialogs/insertlink.php?rta_id=' + this.m_id + '&rta_region=' + this.m_region, cmd, 542, 393);
			else this.handleCommand('insertHTML', option);
			break;

		case 'inserttable': // inserts an table
			if (!option) this._dialogPopup(this.m_includePath + 'dialogs/inserttable.php?rta_id=' + this.m_id + '&rta_region=' + this.m_region, cmd, 420, 350);
			else this.handleCommand('insertHTML', option);
			break;

		case 'insertimage': // inserts an image
			if (!option) Modalbox.show('/protoeditor/image', {title: 'Insert Image', width: 700}); //this._dialogPopup(this.m_includePath + 'dialogs/insertimage.php?rta_id=' + this.m_id + '&rta_region=' + this.m_region, cmd, 470, 240);
			else this.handleCommand('insertHTML', option);
			break;

		case 'insertentity': // inserts an html entity
			if (!option) Modalbox.show('/protoeditor/entity', {title: 'Insert Entity', width: 400}); //this._dialogPopup(this.m_includePath + 'dialogs/insertentity.php?rta_id=' + this.m_id + '&rta_region=' + this.m_region, cmd, 395, 446);
			else this.handleCommand('insertHTML', option);
			break;

		case 'insertcomponent': // inserts a component (weblisher)
			if (!option) this._dialogPopup(this.m_includePath + 'dialogs/insertcomponent.php?rta_id=' + this.m_id + '&rta_region=' + this.m_region, cmd, 420, 130);
			else this.handleCommand('insertHTML', option);
			break;

		case 'insertspan': // inserts a span tag with a given class
			this.handleCommand('insertHTML', '<span class="' + option + '">' + this.getSelected(this.m_region) + '</span>');
			break;

		case 'removeformating': // removes any formating for the selected text
			html = this.getSelected(this.m_region);
			if (html) this.handleCommand('insertHTML', html);
			break;

		case 'toggleHTML': // switches between design view and source view
			var h = this.m_doc.getElementById(this.m_region + '_hidden');
			var r = this.m_region.replace("rta_", "");

			if (this.m_regions[r][VIEW_SOURCE])
			{
				// switch to design view
				if (this.m_doc.all)
				{
					var f = this.m_doc.frames[this.m_region].document.body;
					var output = escape(f.innerText);
					output = output.replace("%3CP%3E%0D%0A%3CHR%3E", "%3CHR%3E");
					output = output.replace("%3CHR%3E%0D%0A%3C/P%3E", "%3CHR%3E");
					f.innerHTML = unescape(output);
				}
				else
				{
					var f = this.m_doc.getElementById(this.m_region).contentWindow.document;
					var htmlSrc = f.body.ownerDocument.createRange();
					htmlSrc.selectNodeContents(f.body);
					f.body.innerHTML = htmlSrc.toString();
				}

				this.m_regions[r][VIEW_SOURCE] = false;
				//this.toggleToolbar(true);
			}
			else
			{
				// switch to source view
				if (this.m_doc.all) html = this.m_doc.frames[this.m_region].document.body.innerHTML;
				else html = this.m_doc.getElementById(this.m_region).contentWindow.document.body.innerHTML;

				h.value = html;

				if (this.m_doc.all) this.m_doc.frames[this.m_region].document.body.innerText = h.value;
				else
				{
					var f = document.getElementById(this.m_region).contentWindow.document;
					var htmlSrc = f.createTextNode(h.value);
					f.body.innerHTML = '';
					f.body.appendChild(htmlSrc);
				}

				this.m_regions[r][VIEW_SOURCE] = true;
				//this.toggleToolbar(false);
			}
			break;

		case 'insertHTML': // handles all special html inserts
			var f;
			if (this.m_doc.all) f = this.m_doc.frames[this.m_region];
			else f = this.m_doc.getElementById(this.m_region).contentWindow;

			f.focus();
			if (this.m_doc.all)
			{
				var of = f.document.selection.createRange();
				of.pasteHTML(option);
				of.collapse(false);
				of.select();
			}
			else
			{
				if (option != '') f.document.execCommand('insertHTML', false, option);
			}
			break;

		default: // handles all the standard commands not defined above
			var f;
			if (this.m_doc.all) f = this.m_doc.frames[this.m_region];
			else f = this.m_doc.getElementById(this.m_region).contentWindow;
			try
			{
				f.focus();
				f.document.execCommand(cmd, false, option);
				f.focus();
			}
			catch (e)
			{
				//alert(e);
			}
	}
}


/**
 * Opens dialogs for inserting hyperlinks etc.
 */
function _dialogPopup(url, win, width, height, options)
{
	if (typeof(options) == 'undefined') options = 'location=0,status=0,scrollbars=no,';

	var left = (screen.availWidth - width) / 2;
	var top = (screen.availHeight - height) / 2;

	options += 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;

	return window.open(url, win, options);
}


/**
 * Returns the selected text in the editable region.
 */
function _getSelected(region)
{
	var ret = '';
	var f;

	if (this.m_doc.all)
	{
		f = this.m_doc.frames[region];
		var selection = f.document.selection;
		if (selection != null) ret = selection.createRange().text;
	}
	else
	{
		f = this.m_doc.getElementById(region).contentWindow;
		var selection = f.getSelection();

		// !! figure out how to get the offset of the section and the length so
		// we can get to the html.. or figure out a better way.
		//alert(selection.focusOffset);
		//for (var i in selection.focusNode)
		//{
		//	alert(i + ':' + selection.focusNode[i]);
		//}
		if (selection != null) ret = selection.getRangeAt(selection.rangeCount - 1).cloneRange();
	}
	return ret;
}

/**
 * Updates the hidden field for an editable region.
 */
function _updateField(region)
{
	// if source view, switch back to design view
	if (this.m_regions[region][0]) this.handleCommand('toggleHTML', region);

	var hf = this.m_doc.getElementById('rta_' + region + '_hidden');
	if (hf.value == null) hf.value = '';

	var html;
	if (this.m_doc.all) html = this.m_doc.frames['rta_' + region].document.body.innerHTML;
	else html = this.m_doc.getElementById('rta_' + region).contentWindow.document.body.innerHTML;

	//h.value = get_xhtml(this.m_doc.getElementById('dm_' + region).contentWindow.document.body, lang, encoding);
	hf.value = html;
}


/**
 * This gets information about the document that will be containing this instances editable regions
 * by reading the stylesheets and figuring out other basic stuff about the document object that
 * we need to know about.
 */
function _setupDocument(doc, inheritCSS)
{
	if (this.m_doc) return this.m_doc;
	this.m_doc = doc;

	// figure out if the browser is designMode capable (safari and konqueror think they're
	// designMode capable but they aren't) -- this code is also located in _writeToolbar()
	if (doc.getElementById && doc.designMode && !this.m_isSafari && !this.m_isKonqueror)
		this.m_isContentEditable = true;

	// get the css rules for all the included style sheets from the containing document
	if (inheritCSS) this.m_styleSheet = this._getStyleSheetRules(doc);
}


/**
 * Walk up the DOM until a form tag is found -- when it is, we assume it's the form that contains
 * the editable region, and we update the onsubmit function to rta_submitWithRichTextareas().
 */
function _updateFormOnSubmit(idName)
{
	var el = this.m_doc.getElementById('rta_' + idName + this.m_id);
	if (el == null)
	{
		setTimeout("RichTextarea.getInstance('" + this.m_id + "')._updateFormOnSubmit('" + idName + "');", 10);
		return;
	}

	// walk up the DOM until we find the form that we're in so we can handle when we're submitted
	while (el.parentNode)
	{
		if (el.tagName == 'FORM')
		{
			var os = el.onsubmit;
			if (typeof(os) == 'undefined') el.onsubmit =  function onsubmit(event) { return rta_submitWithRichTextareas() };

			break;
		}
		else el = el.parentNode
	}
}


/**
 * Turns on design mode for the editable areas.
 */
function _enableDesignMode(idName, content, toolBar, baseUrl)
{
	var extraStyle = 'TABLE, TD { border: 1px dotted red; }';

	if (this.m_isIE)
	{
		// get the editable region, and it's parent node (if it's in a div, or td etc)
		var f = this.m_doc.getElementById('rta_' + idName + this.m_id);
		var p = f.parentNode;

		// make the content for the iframe by first getting the calculated styles of it's parent node
		inheritedStyles = this._getComputedStyles(p, this.m_desiredStyles);
		var inheritedStyle = '';
		for (var style in inheritedStyles) inheritedStyle += style + ':' + inheritedStyles[style].replace(/"/g, "'") + ';\n';

		// create the html for the region based on the everything we know already
		var frameHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" ><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" id="rta_frame_' + idName + this.m_id + '">' +
			'<head><meta http-equiv="content-type" content="text/html;charset=utf-8"/>' + ((baseUrl) ? '<BASE HREF="' + baseUrl + '">' : '') + '<style>' + this.m_styleSheet + extraStyle + '</style></head>' +
			'<body style="' + inheritedStyle + 'margin:0px;padding:0px;">' + content + '</body></html>';

		// put the html into the iframe, and turn designmode on
		var f = this.m_doc.frames['rta_' + idName + this.m_id];
		f.document.open();
		f.document.write(frameHtml);
		f.document.close();
		f.document.designMode = 'On';

		// attach a handler to enable keyboard shortcuts and focus
		f.attachEvent('onfocus', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._onFocus(e, 'rta_" + idName + this.m_id + "', " + toolBar + ");"), true);
		f.document.attachEvent('onkeypress', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._keyPress(e, 'rta_" + idName + this.m_id + "');"));
		f.document.attachEvent('onmouseup', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._interfaceHandler(e, 'rta_" + idName + this.m_id + "', " + toolBar + ");"));
	}
	else
	{
		var f = this.m_doc.getElementById('rta_' + idName + this.m_id);
		try
		{
			// turn the designmode on
			f.contentDocument.designMode = 'on';
			try
			{
				var p = f.parentNode;

				// make the content for the iframe by first getting the calculated styles of it's parent node
				inheritedStyles = this._getComputedStyles(p, this.m_desiredStyles);
				var inheritedStyle = '';
				for (var style in inheritedStyles) inheritedStyle += style + ':' + inheritedStyles[style].replace(/"/g, "'") + ';\n';

				// create the html for the region based on the everything we know already
    		var frameHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" ><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" id="rta_frame_' + idName + this.m_id + '">' +
    			'<head><meta http-equiv="content-type" content="text/html;charset=utf-8"/>' + ((baseUrl) ? '<BASE HREF="' + baseUrl + '">' : '') + '<style>' + this.m_styleSheet + extraStyle + '</style></head>' +
    			'<body style="' + inheritedStyle + 'margin:0px;padding:0px;">' + content + '</body></html>';

				// put the html into the iframe
				var f = this.m_doc.getElementById('rta_' + idName + this.m_id).contentWindow.document;
				f.open();
				f.write(frameHtml);
				f.close();

				// attach a handler for gecko browsers to enable keyboard shortcuts and focus
				if (this.m_isGecko)
				{
					f.addEventListener('focus', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._onFocus(e, 'rta_" + idName + this.m_id + "', " + toolBar + ");"), true);
					f.addEventListener('keypress', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._keyPress(e);"), true);
					f.addEventListener('mouseup', new Function("e", "return RichTextarea.getInstance('" + this.m_id + "')._interfaceHandler(e, 'rta_" + idName + this.m_id + "', " + toolBar + ");"), true);
				}
			}
			catch (e)
			{
				alert('Error preloading content.');
			}
		}
		catch (e)
		{
			// gecko may take some time to enable design mode so loop until set
			if (this.m_isGecko) setTimeout("RichTextarea.getInstance('" + this.m_id + "')._enableDesignMode('" + idName + "', '" + content + "', '" + toolBar + "', '" + baseUrl + "');", 10);
			else return false;
		}
	}
}


/**
 * Gets the computed style attributes of any element.  In our case we typically use it to get the
 * style attributes of the parent node of an editable region.
 * Returns an object containing the style attributes, and their values.
 */
function _getComputedStyles(element, desiredStyles)
{
	if (!element || element.nodeType != 1 || !element.tagName) return;

	var styles = new Object();

	if (window.getComputedStyle)
	{
		compStyle = element.ownerDocument.defaultView.getComputedStyle(element, '');

		for (var i = 0; i < compStyle.length; ++i)
		{
			var a = compStyle.item(i),
				v = compStyle.getPropertyValue(a);

			if (desiredStyles[a]) styles[a] = v;
		}
	}
	else if (element.currentStyle)
	{
		for (var i in desiredStyles)
		{
			var v = eval('element.currentStyle.' + desiredStyles[i]);
			if (v)
			{
				if (typeof(v) != 'string') v = v.toString();
				styles[i] = v;
			}
		}
	}

	return styles;
}


/**
 * Loops through each of the stylesheets linked in a document passed to it
 * and returns a string containing all of the css rules from each one.
 */
function _getStyleSheetRules(doc)
{
	var ret = '';

	// get the all the css styles defined in the containing document
	// so they can be applied to the iframe
	if (this.m_isIE)
	{
		for (var i = 0; i <= doc.styleSheets.length - 1; i++)
		{
			ret += doc.styleSheets[i].cssText;
		}
	}
	else
	{
		for (var i = 0; i < doc.styleSheets.length; i++)
		{
			try
			{
				var c = doc.styleSheets[i].cssRules;
				for (var j in c)
				{
					if (typeof(c[j].cssText) != 'undefined') ret += c[j].cssText + '\n';
				}
			}
			catch(e)
			{
				alert('Error including remote stylesheet.');
			}
		}
	}

	return ret;
}


/**
 * Displays a palette dialog (button pulldown).
 */
function _dialogPalette(palette, button, hide)
{
	// get the elements we'll deal with
	var pal = document.getElementById('rta_palette_' + palette);

	if (!pal) return;

	if (hide)
	{
		pal.style.visibility = "hidden";
		if (button) button.className = 'rta_button';
		return;
	}

	// set the dialog position
	pal.style.left = find_offset_left(button) + "px";

	// if palette is currently open, close it, otherwise show it
	if (pal.style.visibility == "hidden")
	{
		pal.style.visibility = "visible";
		button.className = 'rta_button_over';

		// set a variable in the palette frame that we can use to return the information back to the
		// correct instance that opened it
		var f;
		if (this.m_doc.all) f = this.m_doc.frames['rta_palette_' + palette];
		else f = this.m_doc.getElementById('rta_palette_' + palette).contentWindow;
		try
		{
			f.owner = this;
			f.ownerButton = button;
		}
		catch (e)
		{
			alert(e);
		}
	}
	else
	{
		pal.style.visibility = "hidden";
		button.className = 'rta_button';
	}
}


/**
 * Functioin handles when a click or action is made to do all the interface cleanup (hide palettes
 * etc).
 */
function _interfaceHandler(e, idName, toolBar)
{
	if (e && e.target)
	{
		desiredStyles = new Object();
		desiredStyles['font-style'] = 'fontStyle';
		desiredStyles['font-weight'] = 'fontWeight';
		desiredStyles['text-decoration'] = 'textDecoration';

		//for (var a in attr) alert(a + ":\n" + attr[a]);
		try {
			var attr = this._getComputedStyles(e.target, desiredStyles);
			if (attr)
			{
				var b = this.m_doc.getElementById('rta_button_font_bold' + this.m_id + this.m_toolbar);
				if (attr['font-weight'] == '800' || attr['font-weight'] == 'bold') b.className = 'rta_button_active';
				else b.className = 'rta_button';

				var i = this.m_doc.getElementById('rta_button_font_italic' + this.m_id + this.m_toolbar);
				if (attr['font-style'] == 'italic') i.className = 'rta_button_active';
				else i.className = 'rta_button';

				var u = this.m_doc.getElementById('rta_button_font_underline' + this.m_id + this.m_toolbar);
				if (attr['text-decoration'] == 'underline') u.className = 'rta_button_active';
				else u.className = 'rta_button';

			}
		} catch (e) {
		}
	}

	// get each instance of the rta and handle what needs to be handled
	for (var i in RichTextarea.instances)
	{
		var rta = RichTextarea.getInstance(i);

		// loop through each toolbar
		for (var t = 0; t < rta.m_toolbarCount; t++)
		{
			// hide all the palettes
			for (var i = 0; i < rta.m_palettes.length; i++) rta._dialogPalette(rta.m_palettes[i][0] + rta.m_id + t, null, true);

			// switch off all the palette buttons
			for (var b in rta.m_buttons)
			{
				var button = rta.m_doc.getElementById('rta_button_' + rta.m_buttons[b][2] + rta.m_id + t);
				if (rta.m_buttons[b][0] == 3 && button) button.className = 'rta_button';
			}
		}
	}
}


/**
 * Function monitors for mouse clicks on the editable regions and sets the member variable to the
 * region that should get focus.
 */
function _onFocus(e, idName, toolBar)
{
	if (idName)
	{
		this.m_region = idName;
		if (this.m_debugMode) document.getElementById('rta_debug_div').innerHTML = 'debug: ' + idName;
	}
	if (toolBar) this.m_toolbar = toolBar;

	if (this.m_isGecko && e) e.stopPropagation();
}


/**
 * Function monitors for keypresses on the editable regions and handles various keypresses as
 * commands.
 */
function _keyPress(e, idName)
{
	if (idName) this.m_region = idName;

	this.m_hasChanges = true;

	var key = (e.which || e.charCode || e.keyCode);
	var stringKey = String.fromCharCode(key).toLowerCase();

	if (this.m_isIE)
	{
		// pressing ctrl+enter will result in a <br> tag instead of <p>
		switch (key)
		{
			case 10:
				if (e.ctrlKey)
				{
					this.handleCommand('insertHTML', '<br>');
					e.keyCode = 0;
				}
				break;
		};
	}
	else if (this.m_isGecko)
	{
		// handle bold, italic, and underline shortcut commands
		if (e.ctrlKey)
		{
			var cmd;
			var stop;
			if (key == 13)
			{
				this.handleCommand('insertHTML', '<p>');
				stop = true;
			}
			else
			{
				switch (stringKey)
				{
					case 'b': cmd = "bold"; break;
					case 'i': cmd = "italic"; break;
					case 'u': cmd = "underline"; break;
				};
			}

			if (cmd || stop)
			{
				if (cmd) this.handleCommand(cmd, null);

				// stop the event bubble
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}
}


/**
 * IE specific functions, handles the class changes to replicate the handy css :hover and :active
 * that most other browsers actually support.
 */
function _buttonOver(e)
{
	var el;
	if (!window.event) el = rta_toolbar.event.srcElement;
	else el = window.event.srcElement;
	var cn = el.className;

	if (cn == 'rta_button' || cn == 'rta_button_down') el.className = 'rta_button_over';
}

function _buttonOut(e)
{
	var el;
	if (!window.event) el = rta_toolbar.event.srcElement;
	else el = window.event.srcElement;
	var cn = el.className;

	if (cn == 'rta_button_over' || cn == 'rta_button_down') el.className = 'rta_button';
}

function _buttonDown(e)
{
	var el;
	if (!window.event) el = rta_toolbar.event.srcElement;
	else el = window.event.srcElement;
	var cn = el.className;

	if (cn == 'rta_button' || cn == 'rta_button_over') el.className = 'rta_button_down';
}


/**
 * Setup the class functions, etc.
 */
// Class functions
RichTextarea.prototype.writeRichTextarea = _writeRichTextarea;
RichTextarea.prototype.writeToolbar = _writeToolbar;
RichTextarea.prototype.writeRegion = _writeRegion;
RichTextarea.prototype.handleCommand = _handleCommand;
RichTextarea.prototype.getSelected = _getSelected;
RichTextarea.prototype.updateField = _updateField;

RichTextarea.prototype._setupDocument = _setupDocument;
RichTextarea.prototype._updateFormOnSubmit = _updateFormOnSubmit;
RichTextarea.prototype._enableDesignMode = _enableDesignMode;
RichTextarea.prototype._getComputedStyles = _getComputedStyles;
RichTextarea.prototype._getStyleSheetRules = _getStyleSheetRules;

RichTextarea.prototype._dialogPalette = _dialogPalette;
RichTextarea.prototype._dialogPopup = _dialogPopup;

RichTextarea.prototype._interfaceHandler = _interfaceHandler;
RichTextarea.prototype._onFocus = _onFocus;
RichTextarea.prototype._keyPress = _keyPress;

RichTextarea.prototype.getRegions = function() {
  var regions = {};
  for (var r in this.m_regions) {
    this.updateField(r);
    regions[r.replace(this.m_id, "")] = this.m_doc.getElementById('rta_' + r + '_hidden').value;
  }
  return regions;
};

// IE specific functions
RichTextarea.prototype._buttonOver = _buttonOver;
RichTextarea.prototype._buttonOut = _buttonOut;
RichTextarea.prototype._buttonDown = _buttonDown;

// Instance handling
RichTextarea.instances = new Object();
RichTextarea.getInstance = function(id) { return RichTextarea.instances[id]; }
RichTextarea.idSeed = 0;


/**
 *
 */
function RichTextarea_loadCfg(instance)
{
	// type, mode,		image,					tooltip,				command/action
	// type: 0 = seperator, 1 = button, 2 = toggle button, 3 = palette button, 4 = feedback button
	// mode: -1 = never show, all other buttons will be shown if mode passed to _writeToolbar() is
	//       greater than the mode for each button
	instance.m_buttons = new Array(
		new Array(1, 2, 'command_save', 	'Save',					'handleCommand(\'commandsave\')'),
		new Array(2, 2, 'command_preview',	'Preview',				'handleCommand(\'commandpreview\')'),

		new Array(0, 2),
		new Array(1, 2, 'command_undo',		'Undo',					'handleCommand(\'undo\')'),
		new Array(1, 2, 'command_redo',		'Redo',					'handleCommand(\'redo\')'),

		new Array(0, 2),
		new Array(1, 2, 'command_cut',		'Cut',					'handleCommand(\'cut\')'),
		new Array(1, 2, 'command_copy',		'Copy',					'handleCommand(\'copy\')'),
		new Array(1, 2, 'command_paste',	'Paste',				'handleCommand(\'paste\')'),

		new Array(0, 2),
		new Array(4, 0, 'font_bold',		'Bold',					'handleCommand(\'bold\')'),
		new Array(4, 0, 'font_italic',		'Italic',				'handleCommand(\'italic\')'),
		new Array(4, 0, 'font_underline',	'Underline',			'handleCommand(\'underline\')'),

		new Array(0, 0),
		new Array(4, 0, 'script_sub',		'Subscript',			'handleCommand(\'subscript\')'),
		new Array(4, 0, 'script_super',		'Superscript',			'handleCommand(\'superscript\')'),

		new Array(0, 0),
		new Array(4, 0, 'justify_left',		'Align Left',			'handleCommand(\'justifyleft\')'),
		new Array(4, 0, 'justify_center',	'Center',				'handleCommand(\'justifycenter\')'),
		new Array(4, 0, 'justify_right',	'Align Right',			'handleCommand(\'justifyright\')'),
		new Array(4, 0, 'justify_full',		'Justify Full',			'handleCommand(\'justifyfull\')'),

		new Array(0, 0),
		new Array(1, 0, 'list_numbered',	'Numbered List',		'handleCommand(\'insertorderedlist\')'),
		new Array(1, 0, 'list_unordered',	'Unordered List',		'handleCommand(\'insertunorderedlist\')'),
		new Array(1, 0, 'indent_decrease',	'Decrease Indent',		'handleCommand(\'outdent\')'),
		new Array(1, 0, 'indent_increase',	'Increase Indent',		'handleCommand(\'indent\')'),

		new Array(0, 0),
		new Array(1, 0, 'remove_formating',	'Remove Formating',		'handleCommand(\'removeformating\')'),
		new Array(1, 0, 'insert_hr',		'Horizontal Rule',		'handleCommand(\'inserthorizontalrulespecial\')'),
		new Array(3, 0, 'color_backcolor',	'Background Color',		'handleCommand(\'actionbackcolor\', this)'),
		new Array(3, 0, 'color_forecolor',	'Text Color',			'handleCommand(\'actionforecolor\', this)'),

		new Array(0, 1),
		new Array(1, 1, 'insert_link',		'Hyperlink',			'handleCommand(\'insertlink\')'),
//		new Array(1, 1, 'insert_table',		'Table',				'handleCommand(\'inserttable\')'),
		new Array(1, 1, 'insert_image',		'Image',				'handleCommand(\'insertimage\')'),
		new Array(1, 1, 'insert_entity',	'Special Character',	'handleCommand(\'insertentity\')'),
//		new Array(1, 2, 'insert_component',	'Component',			'handleCommand(\'insertcomponent\')'),
		new Array(2, 1, 'insert_html',		'HTML View',			'handleCommand(\'toggleHTML\')')
		);

	// palette dialogs, which are only shown when a toolbar button is clicked check
	// _handleCommand() for more information about how the buttons and palettes are linked
	instance.m_palettes = new Array(
		new Array('backcolor', 'backcolor.html', 155, 122, 'color_backcolor'),
		new Array('forecolor', 'forecolor.html', 155, 122, 'color_forecolor')
		);

	// classes styles, fonts, and sizes to include in the pulldowns
	instance.m_styles = new Array(
		new Array('', '[Style]'),
		new Array('', 'None')
		);
	instance.m_blocks = new Array(
		new Array('', '[Block]'),
		new Array('<p>', 'Paragraph'),
		new Array('<h1>', 'Heading 1 &lt;h1&gt;'),
		new Array('<h2>', 'Heading 2 &lt;h2&gt;'),
		new Array('<h3>', 'Heading 3 &lt;h3&gt;'),
		new Array('<h4>', 'Heading 4 &lt;h4&gt;'),
		new Array('<h5>', 'Heading 5 &lt;h5&gt;'),
		new Array('<h6>', 'Heading 6 &lt;h6&gt;'),
		new Array('<pre>', 'Formatted')
		);
	instance.m_fonts = new Array(
		new Array('', '[Font]'),
		new Array('Verdana, Geneva, Arial, Helvetica, sans-serif', 'Default'),
		new Array('Arial, Helvetica, sans-serif', 'Arial'),
		new Array('Courier New, Courier, mono', 'Courier New'),
		new Array('Times New Roman, Times, serif', 'Times New Roman'),
		new Array('Verdana, Arial, Helvetica, sans-serif', 'Verdana')
		);
	instance.m_sizes = new Array(
		new Array('', '[Size]'),
		new Array('2', 'Default'),
		new Array('1', '1'),
		new Array('2', '2'),
		new Array('3', '3'),
		new Array('4', '4'),
		new Array('5', '5')
		);

	// styles to calculate and pull from the containing page for the editable regions
	// these styles will be calculated from the td, div, or whatever contains the editable region
	// they should be formated with the actual css defined attribute = the javascript defined
	//   properties
	instance.m_desiredStyles = new Object();
	instance.m_desiredStyles['background-color'] = 'backgroundColor';
	instance.m_desiredStyles['color'] = 'color';
	instance.m_desiredStyles['font-family'] = 'fontFamily';
	instance.m_desiredStyles['font-size'] = 'fontSize';
	instance.m_desiredStyles['font-stretch'] = 'fontStretch';
	instance.m_desiredStyles['font-style'] = 'fontStyle';
	instance.m_desiredStyles['font-variant'] = 'fontVariant';
	instance.m_desiredStyles['font-weight'] = 'fontWeight';
	instance.m_desiredStyles['line-height'] = 'lineHeight';
	instance.m_desiredStyles['text-align'] = 'textAlign';
	instance.m_desiredStyles['text-indent'] = 'textIndent';
	instance.m_desiredStyles['text-shadow'] = 'textShadow';
	instance.m_desiredStyles['text-transform'] = 'textTransform';
	instance.m_desiredStyles['vertical-align'] = 'verticalAlign';
	instance.m_desiredStyles['word-spacing'] = 'wordSpacing';
	instance.m_desiredStyles['direction'] = 'direction';
}

















/**
 * Handles the floating toolbar for when the editor is using the entire page.
 */
function rta_floatingToolbar(margin)
{
	var startX = 0; // x offset of toolbar in pixels
	var startY = 0; // y offset of toolbar in pixels

	var ns = (navigator.appName.indexOf('Netscape') != -1) || window.opera;
	var doc = ((document.compatMode && document.compatMode != 'BackCompat') ? document.documentElement : document.body);

	var ftlObj = document.getElementById('rta_floating_toolbar');

	document.body.style.marginTop = margin + 'px';

	if (document.layers) ftlObj.style = ftlObj;

	ftlObj.sP = function(x, y) {this.style.left = x + 'px'; this.style.top = y + 'px';};
	ftlObj.x = startX;
	ftlObj.y = startY;

	window.stayTopLeft = function()
	{
		var pY = ns ? pageYOffset : doc.scrollTop;
		ftlObj.y += (pY + startY - ftlObj.y);

		ftlObj.sP(ftlObj.x, ftlObj.y);
		setTimeout('stayTopLeft()', 1);
	}

	stayTopLeft();
}

/**
 * Handle leaving the page when there have been changes made.
 */
function rta_onBeforeUnload()
{
	var ask = false;
	for (var i in RichTextarea.instances) if (RichTextarea.getInstance(i).m_hasChanges) ask = true;
	if (ask) return "You've made changes to this page without saving.  Are you sure you'd like to leave the page without saving your changes?";
}

/**
 * Sets the hidden fields for each editable region of each RichTextarea in a given form to the
 * content of the editiable regions so the form can be submitted normally.
 */
function rta_submitWithRichTextareas()
{
	for (var i in RichTextarea.instances)
	{
		var rta = RichTextarea.getInstance(i);

		for (var r in rta.m_regions) rta.updateField(r);
	}

	return true;
}









function find_offset_left(el)
{
	var ret = 0;

	if (el.offsetParent)
	{
		while (el.offsetParent)
		{
			ret += el.offsetLeft
			el = el.offsetParent;
		}
	}
	else if (el.x) ret += el.x;

	return ret;
}
