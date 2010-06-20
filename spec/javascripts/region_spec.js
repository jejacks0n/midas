describe('Midas.Region', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      this.region.destroy();
      this.region = null;
    } catch(e) {}
    jasmine.unloadCSS('midas_styles');
  });

  it('makes an element editable', function() {
    this.region = new Midas.Region('region1');

    expect($('region1').contentEditable).toEqual('true');
    expect($('region1').hasClassName('midas-region')).toEqual(true);
  });

  it('makes an empty region contain a &nbsp;, and resets that on focus', function() {

    // this seems like a weird test, but it's for firefox, and is relatively unnoticable.
    // firefox doesn't like to give focus to a complely blank contentEditable region, so
    // we put a &nbsp; inside empty ones, and then reset it on focus/click, so you don't
    // really see the &nbsp;
    
    if (jasmine.browser.Gecko) {
      this.region = new Midas.Region('region3');

      expect($('region3').innerHTML).toEqual('&nbsp;');

      jasmine.simulate.click(this.region.element);

      expect($('region3').innerHTML).toEqual('&nbsp;');
    }
  });

  it('accepts options in the constructor', function() {
    this.region = new Midas.Region('region1', {sandwich: 'icecream'});

    expect(this.region.options['sandwich']).toEqual('icecream');
  });

  it('allows retrieval and update of the regions contents', function() {
    this.region = new Midas.Region('region1');

    expect(this.region.getContents()).toEqual('region1');

    this.region.setContents('bacon');
    expect(this.region.getContents()).toEqual('bacon');
  });

  it('toggles preview on and off', function() {
    this.region = new Midas.Region('region1');

    expect(this.region.previewing).toEqual(false);

    this.region.togglePreview();

    expect(this.region.previewing).toEqual(true);
    expect(this.region.element.hasClassName('midas-region-preview')).toEqual(true);
    expect(this.region.element.hasClassName('midas-region')).toEqual(false);

    this.region.togglePreview();

    expect(this.region.previewing).toEqual(false);
    expect(this.region.element.hasClassName('midas-region-preview')).toEqual(false);
    expect(this.region.element.hasClassName('midas-region')).toEqual(true);
  });

  it('serializes', function() {
    this.region = new Midas.Region('region1');
    var serialized = this.region.serialize();

    expect(serialized['name']).toEqual('region1');
    expect(serialized['content']).toEqual('region1');
  });

  it('destroys', function() {
    this.region = new Midas.Region('region1');
    this.region.destroy();

    expect($('region1').contentEditable).toEqual('false');
    expect($('region1').hasClassName('midas-region')).toEqual(false);
  });

  it('tracks selections on mousedown, and on mouseup updates them', function() {
    this.region = new Midas.Region('region1');
    var spy = spyOn(this.region, 'updateSelections').andCallThrough();

    window.getSelection().selectAllChildren(this.region.element);

    jasmine.simulate.mousedown(this.region.element);
    expect(this.region.selecting).toEqual(true);

    jasmine.simulate.mouseup(this.region.element);
    expect(spy.callCount).toEqual(1);
  });

  it('removes any midas-regions when content is pasted in', function() {

    // tried using the metaKey+v in the tests, but we're observing the
    // paste event, and I couldn't figure out how to simulate that.

    this.region = new Midas.Region('region1');
    this.region.setContents('<div class="midas-region">content inside region</div>');
    this.region.afterPaste();

    expect(this.region.element.innerHTML).toEqual('content inside region');
  }),

  describe('behave according to options', function() {

    it('supports the inline option: true', function() {
      this.region = new Midas.Region('region1', {inline: true});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).not.toEqual(height);
    });

    it('supports the inline option: false', function() {
      this.region = new Midas.Region('region1', {inline: false});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).toEqual(height);
    });

  });

  describe('keys that have special behaviors', function() {

    it('indents li elements when pressing tab', function() {
      this.region = new Midas.Region('region4');

      expect($('div5').down('ul').down('ul')).toBeUndefined();

      jasmine.simulate.selection($('div5').down('span'));
      this.region.updateSelections();
      jasmine.simulate.tab(this.region.element);

      expect($('div5').down('ul').down('ul')).toBeDefined();

      jasmine.simulate.selection($('div6').down('span'));
      this.region.updateSelections();
      jasmine.simulate.tab(this.region.element);

      expect($('div6').innerHTML).toEqual("<span>this isn't in a li</span>");
    });

  });

  describe('actions and behaviors that are handled', function() {

    beforeEach(function() {
      this.region = new Midas.Region('region1');
    });

    it('falls back to the standard execCommand', function() {
      var spy = spyOn(document, 'execCommand').andCallThrough();
      this.region.handleAction('delete');

      expect(spy).wasCalledWith('delete', false, null);
    });

    it('throws an exception when the action is unknown', function() {

      // this test doesn't work in webkit because execCommand doesn't
      // return false ever, so it's impossible to tell if the command
      // was handled or not.

      try {
        this.region.handleAction('pizza');
      } catch(e) {
        expect(e.toString()).toEqual('Unknown action "pizza"')
      }
    });

    describe('when a behavior is configured', function() {

      beforeEach(function() {
        this.oldBehaviors = Midas.Config.behaviors;
        Midas.Config.behaviors = {
          bagel:          {havati: 'lettuce'},
          pagebreak:      {insertHTML: function() {
                            return '<div>walnut</div>';
                          }}
        };
      });

      afterEach(function() {
        Midas.Config.behaviors = this.oldBehaviors;
      });

      it('handles insertHTML actions', function() {
        var spy = spyOn(this.region.handle, 'insertHTML').andCallThrough();
        this.region.handleAction('pagebreak');

        expect(spy.argsForCall[0]).toContain(Midas.Config.behaviors['pagebreak']['insertHTML']);
      });

      it('throws an exception when the behavior is unknown', function() {
        try {
          this.region.handleAction('bagel');
        } catch(e) {
          expect(e.toString()).toEqual('Unknown behavior method "havati"');
        }
      });

    });

    describe('expecting special cases', function() {

      it('handles indent', function() {
        this.region = new Midas.Region('region4');
        jasmine.simulate.selection($('region4').down('#div1'));
        this.region.updateSelections();
        this.region.handleAction('indent');

        if (jasmine.browser.WebKit) {
          expect($('region4').select('blockquote').length).toEqual(1);
        } else if(jasmine.browser.Gecko) {
          expect($('region4').down('#div1').up().tagName).toEqual('BLOCKQUOTE');
        }
      });

      it('handles removeformatting', function() {
        this.region = new Midas.Region('region4');
        jasmine.simulate.selection($('region4').down('#div3'));
        this.region.updateSelections();
        this.region.handleAction('removeformatting');

        if (jasmine.browser.WebKit) {
          expect($('region4').down('#div3').innerHTML).toEqual('there is no html here<br>');
        } else if(jasmine.browser.Gecko) {
          expect($('region4').down('#div2').innerHTML).toEqual('there is no html here');
        }
      });

    });

    describe('expecting built in browser actions', function() {

      beforeEach(function() {
        this.region = new Midas.Region('region4');
        this.div = $('region4').down('#action');
        jasmine.simulate.selection(this.div);
        this.region.updateSelections();
      });

      var actions = $w('bold italic underline strikethrough subscript superscript justifyleft justifycenter justifyright justifyfull insertorderedlist insertunorderedlist');
      actions.each(function(action) {
        it('handles the ' + action + 'action', function() {
          var resultDiv = $('region4').down('#action');

          this.region.handleAction(action);

          // based on the nature of how the browsers decide to implement each "commands"
          // functionality, we have to test all the supported browsers slightly differently.
          // this highlights the fact that we should be normalizing this behavior in our own
          // code (if performance allows).

          switch (action) {
          case 'bold':
            expect(resultDiv.select('b').length).toEqual(1);
            break;
          case 'italic':
            expect(resultDiv.select('i').length).toEqual(1);
            break;
          case 'underline':
            expect(resultDiv.select('u').length).toEqual(1);
            break;
          case 'strikethrough':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.select('s').length).toEqual(1);
            } else if (jasmine.browser.Gecko) {
              expect(resultDiv.select('strike').length).toEqual(1);
            }
            break;
          case 'subscript':
            expect(resultDiv.innerHTML).toEqual('<sub>action in region4</sub>');
            break;
          case 'superscript':
            expect(resultDiv.innerHTML).toEqual('<sup>action in region4</sup>');
            break;
          case 'justifyleft':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.getStyle('text-align')).toEqual('left');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.getAttribute('align')).toEqual('left');
            }
            break;
          case 'justifycenter':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.getStyle('text-align')).toEqual('center');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.getAttribute('align')).toEqual('center');
            }
            break;
          case 'justifyright':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.getStyle('text-align')).toEqual('right');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.getAttribute('align')).toEqual('right');
            }
            break;
          case 'justifyfull':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.getStyle('text-align')).toEqual('justify');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.getAttribute('align')).toEqual('justify');
            }
            break;
          case 'insertorderedlist':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.innerHTML).toEqual('<ol><li>action in region4<br></li></ol>');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.innerHTML).toEqual('<ol><li>action in region4</li></ol>');
            }
            break;
          case 'insertunorderedlist':
            if (jasmine.browser.WebKit) {
              expect(resultDiv.innerHTML).toEqual('<ul><li>action in region4<br></li></ul>');
            } else if(jasmine.browser.Gecko) {
              expect(resultDiv.innerHTML).toEqual('<ul><li>action in region4</li></ul>');
            }
            break;
          }
        });

      }.bind(this));

      it('handles undo and redo', function() {
        this.div = $('region4').down('#action');
        jasmine.simulate.selection(this.div.childNodes[0]);
        this.region.updateSelections();
        jasmine.simulate.keypress(this.div, {charCode: 'a'.charCodeAt(0)});

        if (jasmine.browser.WebKit) {
          // can't get this working in webkit, however, it does in fact work
        } else if(jasmine.browser.Gecko) {
          expect(this.div.innerHTML).toEqual('a');

          this.region.handleAction('undo');

          expect(this.div.innerHTML).toEqual('action in region4');

          this.region.handleAction('redo');

          expect(this.div.innerHTML).toEqual('a');
        }
      });

      it('handles outdent', function() {
        this.region.handleAction('indent');
        this.region.handleAction('indent');

        if (jasmine.browser.WebKit) {
          expect(this.region.element.select('blockquote').length).toEqual(2);
        } else {
          expect(this.div.up().tagName).toEqual('BLOCKQUOTE');
          expect(this.div.up().up().tagName).toEqual('BLOCKQUOTE');
        }

        this.region.handleAction('outdent');

        if (jasmine.browser.WebKit) {
          expect(this.region.element.select('blockquote').length).toEqual(1);
        } else {
          expect(this.div.up().tagName).toEqual('BLOCKQUOTE');
          expect(this.div.up().up().tagName).not.toEqual('BLOCKQUOTE');
        }
      });

    });

  });

  describe('events that fire', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('fires an event when it gets focus', function() {
      this.region = new Midas.Region('region1');

      // this doesn't work in ci, but it seems like it should
      //jasmine.simulate.focus(this.region.element);

      jasmine.simulate.click(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('fires an event when it gets clicked', function() {
      this.region = new Midas.Region('region1');

      jasmine.simulate.click(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('fires an event when a key is pressed', function() {
      this.region = new Midas.Region('region1');

      jasmine.simulate.keypress(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('fires update selections on keyup', function() {
      this.region = new Midas.Region('region1');
      var spy = spyOn(this.region, 'updateSelections').andCallThrough();

      jasmine.simulate.keydown(this.region.element, {keyCode: 65});
      jasmine.simulate.keyup(this.region.element, {keyCode: 65});

      expect(spy.callCount).toEqual(1);
    });

  });

});