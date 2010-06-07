describe('Midas.Palette', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  afterEach(function () {
    try {
      this.palette.destroy();
      this.palette = null;
    } catch(e) {}
  });

  it('should accept options in the constructor', function() {
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')}, {lettuce: 'banana'});

    expect(this.palette.options['lettuce']).toEqual('banana');
  });

  it('should make a palette', function() {
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    expect(this.palette.element).not.toBeFalsy();
    expect($$('.midas-palette').length).toEqual(1);
  });

  it('should show when the button is clicked', function() {
    var spy = spyOn(Ajax, 'Request');
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('palette_button'));

    expect(spy.callCount).toEqual(1);
    expect(this.palette.element.getStyle('display')).toEqual('block');
  });

  it('should not show if the button is disabled', function() {
    var spy = spyOn(Ajax, 'Request');
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    $('palette_button').addClassName('disabled');
    jasmine.simulate.click($('palette_button'));

    expect(spy.callCount).toEqual(0);
    expect(this.palette.element.getStyle('display')).toEqual('none');

    $('palette_button').removeClassName('disabled');
    $('palette_button').up().addClassName('disabled');
    jasmine.simulate.click($('palette_button'));

    expect(spy.callCount).toEqual(0);
    expect(this.palette.element.getStyle('display')).toEqual('none');
  });
  
  it('should hide', function() {
    var spy = spyOn(Ajax, 'Request');
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('palette_button'));
    expect(this.palette.element.getStyle('display')).toEqual('block');

    jasmine.simulate.click($('palette_button'));
    expect(this.palette.element.getStyle('display')).toEqual('none');
  });

  it('should position itself properly', function() {
    var spy = spyOn(Ajax, 'Request');
    $('palette_button').setStyle('position:absolute;top:100px;left:100px');
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});
    var spy1 = spyOn(this.palette, 'position').andCallThrough();

    jasmine.simulate.click($('palette_button'));
    $('palette_button').setStyle('position:absolute;top:100px;left:100px');
    var lastLeft = this.palette.element.getStyle('left');

    jasmine.simulate.click($('palette_button'));

    $('palette_button').setStyle('position:absolute;top:100px;left:200px');
    jasmine.simulate.click($('palette_button'));

    expect(this.palette.element.getStyle('left')).not.toEqual(lastLeft);

    $('palette_button').setStyle('position:static');
  });

  it('should know if it is visible or not', function() {
    var spy = spyOn(Ajax, 'Request');
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('palette_button'));
    expect(this.palette.visible()).toEqual(true);

    jasmine.simulate.click($('palette_button'));
    expect(this.palette.visible()).toEqual(false);
  });

  it('should load contents from a url', function() {
    var url = '';
    var spy = spyOn(Ajax, 'Request').andCallFake(function() {
      url = arguments[0];
    }.bind(this));
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')}, {url: 'pizzas/cheese'});

    jasmine.simulate.click($('palette_button'));
    expect(url).toEqual('pizzas/cheese');
  });

  it('should call a setup function when it loads a panel', function() {
    window.callCount = 0;
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: "<script>window['setup_backcolor'] = function() { window.callCount++ }</script>"});
    });
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('palette_button'));
    expect(callCount).toEqual(1);
  });

  it('should destroy', function() {
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});
    this.palette.destroy();

    expect(this.palette.element).toBeFalsy();
    expect($$('.midas-palette').length).toEqual(0);
  });

});