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

  it('should accept options in the constructor', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')}, {lettuce: 'banana'});

    expect(this.dialog.options['lettuce']).toEqual('banana');
  });

  it('should make a dialog', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    expect(this.dialog.element).not.toBeFalsy();
    expect($$('.midas-dialog').length).toEqual(1);
  });

  it('should show when the button is clicked', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    expect(this.dialog.element.getStyle('display')).toEqual('none');

    jasmine.simulate.click($('dialog_button'));

    expect(this.dialog.element.getStyle('display')).toEqual('block');
  });

  it('should not show if the button is disabled', function() {
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

  it('should hide', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.element.getStyle('display')).toEqual('block');

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.element.getStyle('display')).toEqual('none');
  });

  it('should know if it is visible or not', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.visible()).toEqual(true);

    jasmine.simulate.click($('dialog_button'));
    expect(this.dialog.visible()).toEqual(false);
  });

  it('should destroy', function() {
    this.dialog = new Midas.Dialog($('dialog_button'), 'backcolor', {element: $('toolbar')});
    this.dialog.destroy();

    expect(this.dialog.element).toBeFalsy();
    expect($$('.midas-dialog').length).toEqual(0);
  });

});