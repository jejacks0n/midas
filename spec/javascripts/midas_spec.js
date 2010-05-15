jasmine.include('midas/midas.js', true);
jasmine.include('midas/editor.js', true);
jasmine.include('midas/toolbar.js', true);

describe('Midas', function () {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    //jasmine.unloadCSS('midas_styles');
  });

  it('should make all regions with the editable class editable', function() {
    var midas = new Midas();

    expect($('region1').contentEditable).toEqual('true');
    expect($('region2').contentEditable).toEqual('true');
    expect($('region3').contentEditable).not.toEqual('true'); // will default to 'inherit' if not specified
  });

  it('should accept options in the constructor', function() {
    var midas = new Midas({classname: 'not-editable'});

    expect($('region1').contentEditable).not.toEqual('true');
    expect($('region3').contentEditable).toEqual('true');
  });

  it('should assign all editable regions to member variables', function() {
    var midas = new Midas();

    expect(midas.regions.length).toEqual(2);
    expect(midas.regionElements).toContain($('region1'));
    expect(midas.regionElements).toContain($('region2'));
  });

  describe('static methods', function () {

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
      var midas = new Midas();
      spyOn(midas.regions[1], 'serialize').andCallFake(function() {
        return {name: 'foo', content: 'bar'};
      });
      midas.save();

      expect(midas.regions[1].serialize).wasCalled();
    });

    describe('using put (updating)', function() {

      it('should generate an ajax request', function () {
        var midas = new Midas({
          saveUrl: '/server',
          saveMethod: 'put'
        });
        midas.save();

        expect(Ajax.Request).wasCalledWith('/server', {
          method: 'put',
          parameters: {_method: 'put', region1: 'region1', region2: 'region2'}
        });
      });

    });

    describe('using post (creating)', function() {

      it('should generate an ajax request', function () {
        var midas = new Midas({
          saveUrl: '/server',
          saveMethod: 'post'
        });
        midas.save();

        expect(Ajax.Request).wasCalledWith('/server', {
          method: 'post',
          parameters: {region1: 'region1', region2: 'region2'}
        });
      });

    });

  });

});