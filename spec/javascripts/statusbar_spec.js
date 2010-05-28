describe('Midas.Statusbar', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  afterEach(function () {
    try {
      this.statusbar.destroy();
      this.statusbar = null;
    } catch(e) {}
  });

  it('should accept options in the constructor', function() {
    this.statusbar = new Midas.Statusbar({lettuce: 'banana'});

    expect(this.statusbar.options['lettuce']).toEqual('banana');
  });

  it('should make a statusbar', function() {
    this.statusbar = new Midas.Statusbar();

    expect(this.statusbar.element).not.toBeFalsy();
    expect($$('.midas-statusbar').length).toEqual(1);
  });

  it('should be able to put the statusbar inside an existing element', function() {
    this.statusbar = new Midas.Statusbar({appendTo: 'statusbar'});

    expect($('statusbar').innerHTML).not.toEqual('statusbar');
  });

  it('should destroy', function() {
    this.statusbar = new Midas.Statusbar();
    this.statusbar.destroy();

    expect(this.statusbar.element).not.toBeFalsy();
    expect($$('.midas-statusbar').length).toEqual(0);
  });

});