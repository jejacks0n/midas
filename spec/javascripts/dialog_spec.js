describe('Midas.Dialog', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  afterEach(function () {
    try {
      this.dialog.destroy();
      this.dialog = null;
    } catch(e) {}
  });

  it('accepts options in the constructor', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')}, {lettuce: 'banana'});

    expect(this.dialog.options['lettuce']).toEqual('banana');
  });

  it('makes a dialog', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    expect(this.dialog.element).not.toBeFalsy();
    expect($$('.midas-dialog').length).toEqual(1);
  });

  it('shows when the button is clicked', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    expect(this.dialog.element.getStyle('display')).toEqual('none');

    jasmine.simulate.click($('dialog_button'));

    expect(this.dialog.element.getStyle('display')).toEqual('block');
  });

  it('does not show if the button is disabled', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    var button = $('dialog_button');
    button.addClassName('disabled');
    jasmine.simulate.click(button);

    expect(this.dialog.element.getStyle('display')).toEqual('none');

    button.removeClassName('disabled');
    button.up().addClassName('disabled');
    jasmine.simulate.click(button);

    expect(this.dialog.element.getStyle('display')).toEqual('none');
  });

  it('adds and removes a class for the active region', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar'), activeRegion: {name: 'region1'}});

    var button = $('dialog_button');
    jasmine.simulate.click(button);

    expect(this.dialog.element.hasClassName('region1')).toEqual(true);
  });

  it('hides', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.element.getStyle('display')).toEqual('block');

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.element.getStyle('display')).toEqual('none');
  });

  it('knows if it is visible or not', function() {
    var spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.visible()).toEqual(true);

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.visible()).toEqual(false);
  });

  it('destroys', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});
    this.dialog.destroy();

    expect(this.dialog.element).toBeFalsy();
    expect($$('.midas-dialog').length).toEqual(0);
  });

});