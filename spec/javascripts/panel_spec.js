describe('Midas.Panel', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    this.toolbar = {element: $('toolbar'), hidePanels: function() {}, getBottomOffset: function() { return 0; }};
  });

  afterEach(function () {
    try {
      this.panel.destroy();
      this.panel = null;
    } catch(e) {}
  });

  it('accepts options in the constructor', function() {
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar, {lettuce: 'banana'});

    expect(this.panel.options['lettuce']).toEqual('banana');
  });

  it('makes a palette', function() {
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    expect(this.panel.element).not.toBeFalsy();
    expect(this.panel.element.down('h3.title')).not.toBeFalsy();
    expect(this.panel.element.down('div')).not.toBeFalsy();
    expect($$('.midas-panel').length).toEqual(1);
  });

  it('loads when the button is clicked', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    jasmine.simulate.click($('panel_button'));

    expect(spy.callCount).toEqual(1);
    expect(this.panel.element.getStyle('display')).not.toEqual('none');
  });

  it('makes the button behave as a toggle button', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    jasmine.simulate.click($('panel_button'));

    expect($('panel_button').hasClassName('pressed')).toEqual(true);

    jasmine.simulate.click($('panel_button'));

    expect($('panel_button').hasClassName('pressed')).toEqual(false);
  });

  it('creates a draggable object with the element', function() {
    var spy = spyOn(Ajax, 'Request');
    var spy1 = spyOn(window, 'Draggable');
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    jasmine.simulate.click($('panel_button'));

    expect(spy1.callCount).toEqual(1);
  });

  it('displays a title in the panel', function() {
    var spy = spyOn(Ajax, 'Request');
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar, {title: 'Hamburgers'});

    jasmine.simulate.click($('panel_button'));

    expect(this.panel.element.down('h3.title').innerHTML).toEqual('Hamburgers');
  });

  it("doesn't show if the button is disabled", function() {
    var spy = spyOn(Ajax, 'Request');
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    var button = $('panel_button');
    button.addClassName('disabled');
    jasmine.simulate.click(button);

    expect(spy.callCount).toEqual(0);
    expect(this.panel.element.getStyle('display')).toEqual('none');

    button.removeClassName('disabled');
    button.up().addClassName('disabled');
    jasmine.simulate.click(button);

    expect(spy.callCount).toEqual(0);
    expect(this.panel.element.getStyle('display')).toEqual('none');
  });

  it('hides', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    jasmine.simulate.click($('panel_button'));
    expect(this.panel.element.getStyle('display')).not.toEqual('none');

    jasmine.simulate.click($('panel_button'));
    expect(this.panel.element.getStyle('display')).toEqual('none');
  });

  stub('positions itself properly', function() {
    
  });

  it('knows if it is visible or not', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);

    jasmine.simulate.click($('panel_button'));
    expect(this.panel.visible).toEqual(true);

    jasmine.simulate.click($('panel_button'));
    expect(this.panel.visible).toEqual(false);
  });

  it('loads contents from a url', function() {
    var url = '';
    var spy = spyOn(Ajax, 'Request').andCallFake(function() {
      url = arguments[0];
    }.bind(this));
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar, {url: 'pizzas/cheese'});

    jasmine.simulate.click($('panel_button'));
    expect(url).toEqual('pizzas/cheese');
  });

  it('destroys', function() {
    this.panel = new Midas.Panel($('panel_button'), 'history', this.toolbar);
    this.panel.destroy();

    expect(this.panel.element).toBeFalsy();
    expect($$('.midas-panel').length).toEqual(0);
  });

});