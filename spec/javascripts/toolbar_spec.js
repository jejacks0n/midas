describe('Midas.Toolbar', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      this.toolbar.destroy();
      this.toolbar = null;
    } catch(e) {
      this.toolbar = null;
    }
    jasmine.unloadCSS('midas_styles');
  });

  it('should accept options in the constructor', function() {
    this.toolbar = new Midas.Toolbar({lettuce: 'banana'});

    expect(this.toolbar.options['lettuce']).toEqual('banana');
  });

  it('should make a toolbar', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.element).not.toBeFalsy();
    expect($(this.toolbar.element.getAttribute('id'))).not.toBeFalsy(1);
    expect($$('body .midas-toolbar').length).toEqual(1);
  });

  it('should generate an id for the toolbar it creates', function() {
    this.toolbar = new Midas.Toolbar();

    var id = this.toolbar.generateId();
    expect($(id)).not.toBeNull();
    expect(this.toolbar.generateId()).toEqual(id);
  });

  it('should be able to put the toolbar inside an existing element', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

    expect($('toolbar').innerHTML).not.toEqual('toolbar');
  });

  it('should fill the toolbar with buttons (based on configuration)', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

    expect($('toolbar').innerHTML).toContain('Save this page');
    expect($('toolbar').innerHTML).toContain('class="midas-flex-separator"');
  });

  it('should make buttons and button groups', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});
    
    expect($('toolbar').select('.midas-group').length).toBeGreaterThan(2);
    expect($('toolbar').innerHTML).toContain('class="midas-group midas-group-list"');
    expect(this.toolbar.buttons['preview']['spec']).
            toEqual(Midas.Config.toolbars['actions']['preview']);
  });

  it('should make separators', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.makeSeparator('-').getAttribute('class')).toEqual('midas-line-separator');
    expect(this.toolbar.makeSeparator('*').getAttribute('class')).toEqual('midas-flex-separator');
    expect(this.toolbar.makeSeparator(' ').getAttribute('class')).toEqual('midas-separator');
  });

  it('should keep track of palettes that is has', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.palettes.length).toEqual(1);
  });

  stub('should hide all palettes when anything besides a palette is clicked', function() {

  });

  stub('should inactivate any active buttons', function() {

  });

  stub('should disable buttons, button groups, and toolbars', function() {

  });

  it('should keep any disabled buttons from being clicked', function() {
    this.toolbar = new Midas.Toolbar();
    var spy = spyOn(Midas, 'fire');

    this.toolbar.element.down('.midas-htmleditorbar').addClassName('disabled');
    jasmine.simulate.click($$('.midas-button-bold')[0]);

    expect(spy.callCount).toEqual(0);

    this.toolbar.element.down('.midas-htmleditorbar').removeClassName('disabled');
    jasmine.simulate.click($$('.midas-button-bold')[0]);

    expect(spy.callCount).toEqual(1);
  });

  stub('should keep track of the active region', function() {

  });

  stub('should observe keypress and mouseup on document', function() {

  });

  stub('should observe keypress and mouseup on the iframe document when appropriate', function() {

  });

  it('should destroy', function() {
    this.toolbar = new Midas.Toolbar();
    this.toolbar.destroy();

    expect(this.toolbar.palettes.length).toEqual(0);
    expect(this.toolbar.element).toBeFalsy();
    expect($$('.midas-toolbar').length).toEqual(0);
  });

  describe('button types and their behaviors', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('should handle regular buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});
      
      jasmine.simulate.click(this.toolbar.buttons['bold'].element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('should handle toggle buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      jasmine.simulate.click(this.toolbar.buttons['preview'].element);
      expect(this.toolbar.buttons['preview'].element.getAttribute('class')).
              toEqual('midas-button midas-button-preview pressed');
      expect(this.spy.callCount).toEqual(2);
    });

    it('should handle context buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      expect(this.toolbar.contexts.length).toBeGreaterThan(2);
    });
    
    it('should handle mode buttons, and buttons with more than one type', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      jasmine.simulate.click(this.toolbar.buttons['preview'].element);
      expect(this.spy.callCount).toEqual(2);
    });

  });

  describe('events that fire', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('should fire at least one event when a button is clicked', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      jasmine.simulate.click($$('.midas-button-insertorderedlist')[0]);
      expect(this.spy.callCount).toBeGreaterThan(0);
    });

  });
  
});