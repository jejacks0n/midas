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

  stub('should show when the button is clicked', function() {

  });

  stub('should hide', function() {

  });

  stub('should position itself properly', function() {

  });

  stub('should know if it is visible or not', function() {

  });

  stub('should load contents from a url', function() {

  });

  stub('should call a setup function', function() {

  });

  it('should destroy', function() {
    this.palette = new Midas.Palette($('palette_button'), 'backcolor', {element: $('toolbar')});
    this.palette.destroy();

    expect(this.palette.element).toBeFalsy();
    expect($$('.midas-palette').length).toEqual(0);
  });

});