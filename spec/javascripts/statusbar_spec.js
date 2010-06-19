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

  it('accepts options in the constructor', function() {
    this.statusbar = new Midas.Statusbar({lettuce: 'banana'});

    expect(this.statusbar.options['lettuce']).toEqual('banana');
  });

  it('makes a statusbar', function() {
    this.statusbar = new Midas.Statusbar();

    expect(this.statusbar.element).not.toBeFalsy();
    expect($$('.midas-statusbar').length).toEqual(1);
  });

  it('handles putting the statusbar inside an existing element', function() {
    this.statusbar = new Midas.Statusbar({appendTo: 'statusbar'});

    expect($('statusbar').innerHTML).not.toEqual('statusbar');
  });

  it('destroys', function() {
    this.statusbar = new Midas.Statusbar();
    this.statusbar.destroy();

    expect(this.statusbar.element).not.toBeFalsy();
    expect($$('.midas-statusbar').length).toEqual(0);
  });

  describe('panels that are default', function() {

    it('displays a path', function() {
      runs(function() {
        this.statusbar = new Midas.Statusbar({appendTo: 'statusbar'});

        var span = $('div5').down('span');
        jasmine.simulate.selection(span);
        this.statusbar.update({element: $('region4')}, {});
      });

      waits(10);

      runs(function() {
        expect(this.statusbar.element.innerHTML).toMatch(/<a>div<\/a> .* <a>ul<\/a> .* <a>li<\/a>/);
      });
    });

  });

});