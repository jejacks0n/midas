describe('Midas.Toolbar', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  afterEach(function () {
    try {
      window.toolbar.destroy();
    } catch(e) {}
  });

  it('should accept options in the constructor', function() {
    window.toolbar = new Midas.Toolbar({lettuce: 'banana'});

    expect(toolbar.options['lettuce']).toEqual('banana');
  });

  it('should make a toolbar', function() {
    window.toolbar = new Midas.Toolbar();

    expect(toolbar.element).not.toBeFalsy();
    expect($(toolbar.element.getAttribute('id'))).not.toBeFalsy(1);
    expect($$('body .midas-toolbar').length).toEqual(1);
  });

  it('should be able to put the toolbar inside an existing element', function() {
    window.toolbar = new Midas.Toolbar({appendTo: 'toolbar'});

    expect($('toolbar').innerHTML).not.toEqual('toolbar');
  });

  it('should fill the toolbar with buttons (based on configuration)', function() {
    window.toolbar = new Midas.Toolbar();

    expect(toolbar.element).not.toBeFalsy();
    expect($(toolbar.element.getAttribute('id'))).not.toBeFalsy(1);
    expect($$('body .midas-toolbar').length).toEqual(1);
  });

  it('should destroy', function() {
    window.toolbar = new Midas.Toolbar();
    toolbar.destroy();

    expect(toolbar.element).not.toBeFalsy();
    expect($(toolbar.element.getAttribute('id'))).toBeFalsy(null);
    expect($$('.midas-toolbar').length).toEqual(0);
  });
});