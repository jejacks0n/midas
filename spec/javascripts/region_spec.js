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

  it('should make an element editable', function() {
    this.region = new Midas.Region('region1');

    expect($('region1').contentEditable).toEqual('true');
  });

  it('should make an empty region contain a &nbsp;, and reset that on focus', function() {

    // this seems like a weird test, but it's for firefox, and is relatively unnoticable.
    // firefox doesn't like to give focus to a complely blank contentEditable region, so
    // we put a &nbsp; inside empty ones, and then reset it on focus/click, so you don't
    // really see the &nbsp;

    this.region = new Midas.Region('region3');

    expect($('region3').innerHTML).toEqual('&nbsp;');

    jasmine.simulate.click(this.region.element);

    expect($('region3').innerHTML).toEqual('&nbsp;');
  });

  it('should accept options in the constructor', function() {
    this.region = new Midas.Region('region1', {sandwich: 'icecream'});

    expect(this.region.options['sandwich']).toEqual('icecream');
  });

  it('should allow retrieval and update of the regions contents', function() {
    this.region = new Midas.Region('region1');

    expect(this.region.getContents()).toEqual('region1');

    this.region.setContents('bacon');
    expect(this.region.getContents()).toEqual('bacon');
  });

  it('should serialize', function() {
    this.region = new Midas.Region('region1');
    var serialized = this.region.serialize();

    expect(serialized['name']).toEqual('region1');
    expect(serialized['content']).toEqual('region1');
  });

  it('should destroy', function() {
    this.region = new Midas.Region('region1');
    this.region.destroy();

    expect($('region1').contentEditable).toEqual('false');
  });

  describe('behave according to options', function() {

    it('should support the inline option: true', function() {
      this.region = new Midas.Region('region1', {inline: true});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).not.toEqual(height);
    });

    it('should support the inline option: false', function() {
      this.region = new Midas.Region('region1', {inline: false});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).toEqual(height);
    });

  });

  describe('actions and behaviors that are handled', function() {

    beforeEach(function() {
//      Midas.Config.behaviors = {
//        bagel:               'havarti',
//        horizontalrule:      'insertHorizontalRule',
//        forecolor:           '<span style="color:$2">$1</span>',
//        bold:                function(action, fragment) {
//                                return '<span style="font-style:italic">' + fragment + '</span>'
//                             }
//      };
      this.region = new Midas.Region('region1');
    });

    it('should fall back to the standard execCommand', function() {
      var spy = spyOn(document, 'execCommand').andCallThrough();
      this.region.handleAction('delete');

      expect(spy).wasCalledWith('delete', false, null);
    });

    it('should throw an exception when the action is unknown', function() {
      try {
        this.region.handleAction('pizza');
      } catch(e) {
        expect(e.toString()).toEqual('Unknown action "pizza"')
      }
    });

    describe('when a behavior is configured', function() {

//    overline
//    horizontalrule
//    pagebreak

//      it('it should handle execCommand actions', function() {
//        var spy = spyOn(document, 'execCommand').andCallThrough();
//        this.region.handleAction('horizontalrule');
//
//        expect(spy).wasCalledWith('inserthorizontalrule', false, null);
//      });
//
//      it('should wrap document fragments within a node', function() {
//      });
//
//      it('should call functions', function() {
//        var spy = spyOn(Midas.Config.behaviors, 'bold');
//        this.region.handleAction('bold');
//
//        expect(spy).wasCalledWith('bold');
//      });
//
//      it('should throw an exception when the behavior is unknown', function() {
//        try {
//          this.region.handleAction('bagel');
//        } catch(e) {
//          expect(e.toString()).toEqual('Unknown action "havarti"')
//        }
//      });

    });

    describe('expecting special cases', function() {

      it('should handle indent', function() {
        this.region = new Midas.Region('region4');
        jasmine.simulate.selection($('region4').down('#div1'));
        this.region.updateSelections();
        this.region.handleAction('indent');

        expect($('region4').down('#div1').getStyle('margin-left')).toEqual('40px');
      });

      it('should handle removeformatting', function() {
        this.region = new Midas.Region('region4');
        jasmine.simulate.selection($('region4').down('#div3'));
        this.region.updateSelections();
        this.region.handleAction('removeformatting');
        
        expect($('region4').down('#div2').innerHTML).toEqual('there is no html here');
      });

    });

    describe('expecting built in browser actions', function() {

      beforeEach(function() {
        this.div = $('region4').down('#div1');
        this.region = new Midas.Region('region4');
        jasmine.simulate.selection(this.div);
        this.region.updateSelections();
      });

      var actions = $w('bold italic underline strikethrough subscript superscript justifyleft justifycenter justifyright justifyfull insertorderedlist insertunorderedlist');
      actions.each(function(action) {
        it('should handle ' + action, function() {
          this.region.handleAction(action);

          switch (action) {
          case 'bold':
            expect(this.div.getStyle('font-weight')).toEqual('bold');
            break;
          case 'italic':
            expect(this.div.getStyle('font-style')).toEqual('italic');
            break;
          case 'underline':
            expect(this.div.getStyle('text-decoration')).toEqual('underline');
            break;
          case 'strikethrough':
            expect(this.div.getStyle('text-decoration')).toEqual('line-through');
            break;
          case 'subscript':
            expect(this.div.innerHTML).toEqual('<sub>div1 in region4</sub>');
            break;
          case 'superscript':
            expect(this.div.innerHTML).toEqual('<sup>div1 in region4</sup>');
            break;
          case 'justifyleft':
            expect(this.div.getStyle('text-align')).toEqual('left');
            break;
          case 'justifycenter':
            expect(this.div.getStyle('text-align')).toEqual('center');
            break;
          case 'justifyright':
            expect(this.div.getStyle('text-align')).toEqual('right');
            break;
          case 'justifyfull':
            expect(this.div.getStyle('text-align')).toEqual('justify');
            break;
          case 'insertorderedlist':
            expect(this.div.innerHTML).toEqual('<ol><li>div1 in region4</li></ol>');
            break;
          case 'insertunorderedlist':
            expect(this.div.innerHTML).toEqual('<ul><li>div1 in region4</li></ul>');
            break;
          }
        });

      }.bind(this));

      it('should handle undo', function() {
      });

      it('should handle redo', function() {
      });

      it('should handle outdent', function() {
        this.region.handleAction('indent');
        this.region.handleAction('indent');

        expect($('region4').down('#div1').getStyle('margin-left')).toEqual('80px');

        this.region.handleAction('outdent');

        expect($('region4').down('#div1').getStyle('margin-left')).toEqual('40px');
      });

    });

  });

  describe('events that fire', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('should fire an event when it gets focus', function() {
      this.region = new Midas.Region('region1');

      // this doesn't work in ci, but it should
      //jasmine.simulate.focus(this.region.element);

      jasmine.simulate.click(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('should fire an event when it gets clicked', function() {
      this.region = new Midas.Region('region1');

      jasmine.simulate.click(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('should fire an event when a key is pressed', function() {
      this.region = new Midas.Region('region1');

      jasmine.simulate.keypress(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('should update selections on keyup', function() {
      this.region = new Midas.Region('region1');
      var spy = spyOn(this.region, 'updateSelections').andCallThrough();

      jasmine.simulate.keydown(this.region.element, {keyCode: 65});
      jasmine.simulate.keyup(this.region.element, {keyCode: 65});

      expect(spy.callCount).toEqual(1);
    });

    it('should track selections on mousedown, and on mouseup update them', function() {
      this.region = new Midas.Region('region1');
      var spy = spyOn(this.region, 'updateSelections').andCallThrough();

      window.getSelection().selectAllChildren(this.region.element);

      jasmine.simulate.mousedown(this.region.element);
      expect(this.region.selecting).toEqual(true);

      jasmine.simulate.mouseup(this.region.element);
      expect(spy.callCount).toEqual(1);
    });

  });

});