describe('Midas', function () {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      window.midas.destroy();
      window.midas = null;
    } catch(e) {}
    //jasmine.unloadCSS('midas_styles');
  });

  it('should make all regions with the editable class editable', function() {
    window.midas = new Midas();

    expect($('region1').contentEditable).toEqual('true');
    expect($('region2').contentEditable).toEqual('true');
    expect($('region3').contentEditable).not.toEqual('true'); // will default to 'inherit' if not specified
  });

  it('should accept options in the constructor', function() {
    window.midas = new Midas({classname: 'not-editable'});

    expect($('region1').contentEditable).not.toEqual('true');
    expect($('region3').contentEditable).toEqual('true');
  });

  it('should assign all editable regions to member variables', function() {
    window.midas = new Midas();

    expect(midas.regions.length).toEqual(2);
    expect(midas.regionElements).toContain($('region1'));
    expect(midas.regionElements).toContain($('region2'));
  });

  it('should destroy', function() {
    window.midas = new Midas();
    midas.destroy();
  });

  describe('static methods', function () {

    // I'm not really sure how to test these.. most of the other tests will
    // be broken if these two fail in a given browser, because most of the
    // features require a level of support in the browser.
    it('should return that it knows what browser is being used', function() {
      expect(Midas.agent()).not.toEqual(false);
    });

    it('should detect if the browser is capible of editing', function() {
      expect(Midas.agentIsCapable()).toEqual(true);
    });

  });

  describe('when saving', function () {

    beforeEach(function() {
      spyOn(Ajax, 'Request').andCallFake(function() {
        var env = jasmine.getEnv();
        env.reporter.log('>> Mock Ajax.Request called...');
      });
    });

    it('should call serialize on the regions', function () {
      window.midas = new Midas();
      spyOn(midas.regions[1], 'serialize').andCallFake(function() {
        return {name: 'banana', content: 'juice'};
      });
      midas.save();

      expect(midas.regions[1].serialize).wasCalled();
    });

    describe('using put (updating)', function() {

      it('should generate an ajax request', function () {
        window.midas = new Midas({
          saveUrl: '/peanuts',
          saveMethod: 'put'
        });
        midas.save();

        expect(Ajax.Request).wasCalledWith('/peanuts', {
          method: 'put',
          parameters: {_method: 'put', region1: 'region1', region2: 'region2'}
        });
      });

    });

    describe('using post (creating)', function() {

      it('should generate an ajax request', function () {
        window.midas = new Midas({
          saveUrl: '/oranges',
          saveMethod: 'post'
        });
        midas.save();

        expect(Ajax.Request).wasCalledWith('/oranges', {
          method: 'post',
          parameters: {region1: 'region1', region2: 'region2'}
        });
      });

    });

  });

});