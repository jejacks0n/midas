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

  it('accepts options in the constructor', function() {
    this.toolbar = new Midas.Toolbar({lettuce: 'banana'});

    expect(this.toolbar.options['lettuce']).toEqual('banana');
  });

  it('makes a toolbar', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.element).not.toBeFalsy();
    expect($(this.toolbar.element.getAttribute('id'))).not.toBeFalsy(1);
    expect($$('body .midas-toolbar').length).toEqual(1);
  });

  it('generates an id for the toolbar it creates', function() {
    this.toolbar = new Midas.Toolbar();

    var id = this.toolbar.generateId();
    expect($(id)).not.toBeNull();
    expect(this.toolbar.generateId()).toEqual(id);
  });

  it('handles putting the toolbar inside an existing element', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

    expect($('toolbar').innerHTML).not.toEqual('toolbar');
  });

  it('fills the toolbar with buttons (based on configuration)', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

    expect($('toolbar').innerHTML).toContain('Save this page');
    expect($('toolbar').innerHTML).toContain('class="midas-flex-separator"');
  });

  it('makes buttons and button groups', function() {
    this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});
    
    expect($('toolbar').select('.midas-group').length).toBeGreaterThan(2);
    expect($('toolbar').innerHTML).toContain('class="midas-group midas-group-list"');
    expect(this.toolbar.buttons['preview']['spec']).
            toEqual(Midas.Config.toolbars['actions']['preview']);
  });

  it('makes separators', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.makeSeparator('-').getAttribute('class')).toEqual('midas-line-separator');
    expect(this.toolbar.makeSeparator('*').getAttribute('class')).toEqual('midas-flex-separator');
    expect(this.toolbar.makeSeparator(' ').getAttribute('class')).toEqual('midas-separator');
  });

  it('keeps track of palettes, selects, and panels that is has', function() {
    this.toolbar = new Midas.Toolbar();

    expect(this.toolbar.palettes.length).toEqual(2);
    expect(this.toolbar.selects.length).toEqual(2);
    expect(this.toolbar.panels.length).toEqual(3);
  });

  pending('hides all palettes when anything besides a palette is clicked', function() {
    
  });

  pending('deactivates any active buttons when clicking outside regions', function() {

  });

  pending('disables buttons, button groups, and toolbars', function() {

  });

  it('keeps any disabled buttons from being clicked', function() {
    this.toolbar = new Midas.Toolbar();
    var spy = spyOn(Midas, 'fire');

    this.toolbar.element.down('.midas-htmleditorbar').addClassName('disabled');
    jasmine.simulate.click($$('.midas-button-bold')[0]);

    expect(spy.callCount).toEqual(0);

    this.toolbar.element.down('.midas-htmleditorbar').removeClassName('disabled');
    jasmine.simulate.click($$('.midas-button-bold')[0]);

    expect(spy.callCount).toEqual(1);
  });

  pending('keeps track of the active region', function() {

  });

  pending('returns the bottom offset of the toolbar for positioning', function() {
    
  });

  pending('observes keypress and mouseup on document', function() {

  });

  pending('observes keypress and mouseup on the iframe document when appropriate', function() {

  });

  pending('adds the active classname on mousedown, and remove it on mouseup', function() {

  });

  it('destroys', function() {
    this.toolbar = new Midas.Toolbar();
    var spy = spyOn(this.toolbar, 'removeObservers').andCallThrough();

    this.toolbar.destroy();

    expect(this.toolbar.palettes.length).toEqual(0);
    expect(this.toolbar.selects.length).toEqual(0);
    expect(this.toolbar.panels.length).toEqual(0);
    expect(this.toolbar.element).toBeFalsy();
    expect($$('.midas-toolbar').length).toEqual(0);
    expect(spy.callCount).toEqual(1);
  });

  describe('button types and their behaviors', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('handles regular buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});
      
      jasmine.simulate.click(this.toolbar.buttons['bold'].element);
      expect(this.spy.callCount).toEqual(1);
    });

    it('handles toggle buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      jasmine.simulate.click(this.toolbar.buttons['preview'].element);
      expect(this.toolbar.buttons['preview'].element.getAttribute('class')).
              toEqual('midas-button midas-button-preview pressed');
      expect(this.spy.callCount).toEqual(2);
    });

    it('handles context buttons', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      expect(this.toolbar.contexts.length).toBeGreaterThan(2);
    });
    
    it('handles mode buttons, and buttons with more than one type', function() {
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

    it('fires at least one event when a button is clicked', function() {
      this.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

      jasmine.simulate.click($$('.midas-button-insertorderedlist')[0]);
      expect(this.spy.callCount).toBeGreaterThan(0);
    });

  });
  
});