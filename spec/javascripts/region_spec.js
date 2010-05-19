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

  it('get the selection', function() {
    this.region = new Midas.Region('region1');
    var element = this.region.element;

//    jasmine.simulate.click(element);
//    jasmine.simulate.keypress(element, {shiftKey: true, keyCode: 39});
//    jasmine.simulate.keypress(element, {shiftKey: true, keyCode: 39});
//
//    console.debug('!!!!!!!!' + window.getSelection().toString());
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
      Midas.Config.behaviors = {
        bagel:               'havarti',
        horizontalrule:      'insertHorizontalRule',
        forecolor:           '<span style="color:$2">$1</span>',
        bold:                function(action, fragment) {
                                return '<span style="font-style:italic">' + fragment + '</span>'
                             }
      };
      this.region = new Midas.Region('region1');
    });

    it('should fall back to the standard execCommand', function() {
      var spy = spyOn(document, 'execCommand').andCallThrough();
      this.region.handleAction('italic');

      expect(spy).wasCalledWith('italic', false, null);
    });

    it('should throw an exception when the action is unknown', function() {
      try {
        this.region.handleAction('pizza');
      } catch(e) {
        expect(e.toString()).toEqual('Unknown action "pizza"')
      }
    });

    describe('when a behavior is configured', function() {

      it('it should handle execCommand actions', function() {
        var spy = spyOn(document, 'execCommand').andCallThrough();
        this.region.handleAction('horizontalrule');

        expect(spy).wasCalledWith('insertHorizontalRule', false, null);
      });

//      it('should wrap document fragments within a node', function() {
//      });

      it('should call functions', function() {
        var spy = spyOn(Midas.Config.behaviors, 'bold');
        this.region.handleAction('bold');

        expect(spy).wasCalledWith('bold', '...');
      });

      it('should throw an exception when the behavior is unknown', function() {
        try {
          this.region.handleAction('bagel');
        } catch(e) {
          expect(e.toString()).toEqual('Unknown action "havarti"')
        }
      });

    });

//    it('should handle bold', function() {
//    });
//
//    it('should handle italic', function() {
//    });
//
//    it('should handle underline', function() {
//    });

  });

  describe('events that fire', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('should fire an event when it gets focus', function() {
      this.region = new Midas.Region('region1');

      //jasmine.simulate.focus(this.region.element); // this doesn't work in ci, but it should
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

//      jasmine.simulate.click(this.region.element);
//      expect(this.spy.callCount).toEqual(1);
    });

  });

});