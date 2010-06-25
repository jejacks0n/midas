describe('Midas.Select', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  afterEach(function () {
    try {
      this.select.destroy();
      this.select = null;
    } catch(e) {}
  });

  it('accepts options in the constructor', function() {
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')}, {lettuce: 'banana'});

    expect(this.select.options['lettuce']).toEqual('banana');
  });

  it('makes a select menu', function() {
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    expect(this.select.element).not.toBeFalsy();
    expect($$('.midas-select').length).toEqual(1);
  });

  it('shows when the button is clicked', function() {
    var spy = spyOn(Ajax, 'Request');
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('select_button'));

    expect(spy.callCount).toEqual(1);
    expect(this.select.element.getStyle('display')).toEqual('block');
  });

  it("doesn't show if the button is disabled", function() {
    var spy = spyOn(Ajax, 'Request');
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    var button = $('select_button');
    button.addClassName('disabled');
    jasmine.simulate.click(button);

    expect(spy.callCount).toEqual(0);
    expect(this.select.element.getStyle('display')).toEqual('none');

    button.removeClassName('disabled');
    button.up().addClassName('disabled');
    jasmine.simulate.click(button);

    expect(spy.callCount).toEqual(0);
    expect(this.select.element.getStyle('display')).toEqual('none');
  });

  it('hides', function() {
    var spy = spyOn(Ajax, 'Request');
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('select_button'));
    expect(this.select.element.getStyle('display')).not.toEqual('none');

    jasmine.simulate.click($('select_button'));
    expect(this.select.element.getStyle('display')).toEqual('none');
  });

  it('positions itself properly', function() {
    var spy = spyOn(Ajax, 'Request');
    var button = $('select_button');
    button.setStyle('position:absolute;top:100px;left:100px');
    this.select = new Midas.Select(button, 'backcolor', {element: $('toolbar')});
    var spy1 = spyOn(this.select, 'position').andCallThrough();

    jasmine.simulate.click(button);
    button.setStyle('position:absolute;top:100px;left:100px');
    var lastLeft = this.select.element.getStyle('left');

    jasmine.simulate.click(button);

    button.setStyle('position:absolute;top:100px;left:200px');
    jasmine.simulate.click(button);

    expect(this.select.element.getStyle('left')).not.toEqual(lastLeft);

    button.setStyle('position:static');
  });

  it('knows if it is visible or not', function() {
    var spy = spyOn(Ajax, 'Request');
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('select_button'));
    expect(this.select.visible).toEqual(true);

    jasmine.simulate.click($('select_button'));
    expect(this.select.visible).toEqual(false);
  });

  it('loads contents from a url', function() {
    var url = '';
    var spy = spyOn(Ajax, 'Request').andCallFake(function() {
      url = arguments[0];
    }.bind(this));
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')}, {url: 'pizzas/cheese'});

    jasmine.simulate.click($('select_button'));
    expect(url).toContain('pizzas/cheese');
  });

  it('calls a setup function when it loads a panel', function() {
    window.callCount = 0;
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: "<script>window['midas_setup_backcolor'] = function() { window.callCount++ }</script>"});
    });
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('select_button'));
    expect(callCount).toEqual(1);
  });

  it('destroys', function() {
    this.select = new Midas.Select($('select_button'), 'backcolor', {element: $('toolbar')});
    this.select.destroy();

    expect(this.select.element).toBeFalsy();
    expect($$('.midas-select').length).toEqual(0);
  });

});