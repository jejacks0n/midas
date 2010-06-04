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
    this.palette = new Midas.Palette($('palette_button'), {lettuce: 'banana'});

    expect(this.palette.options['lettuce']).toEqual('banana');
  });

  it('should make a palette', function() {
    this.palette = new Midas.Palette($('palette_button'));

    expect(this.palette.element).not.toBeFalsy();
    expect($$('.midas-palette').length).toEqual(1);
  });

  it('should show when the button is clicked', function() {

  });

  it('should hide', function() {

  });

  it('should position itself properly', function() {

  });

  it('should know if it is visible or not', function() {

  });

  it('should load contents from a url', function() {

  });

  it('should destroy', function() {
    this.palette = new Midas.Palette($('palette_button'));
    this.palette.destroy();

    expect(this.palette.element).toBeFalsy();
    expect($$('.midas-palette').length).toEqual(0);
  });

});