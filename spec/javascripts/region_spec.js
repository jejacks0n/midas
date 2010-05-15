jasmine.include('midas/midas.js', true);
jasmine.include('midas/region.js', true);
jasmine.include('midas/toolbar.js', true);

describe('Midas.Region', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  it('should make an element editable', function() {
    var region = new Midas.Region('region1');

    expect($('region1').contentEditable).toEqual('true');
  });

  it('should accept options in the constructor', function() {
    var region = new Midas.Region('region1', {sandwich: 'icecream'});

    expect(region.options['sandwich']).toEqual('icecream');
  });

  it('should allow retrieval and update of the regions contents', function() {
    var region = new Midas.Region('region1');

    expect(region.getContents()).toEqual('region1');

    region.setContents('bacon');

    expect(region.getContents()).toEqual('bacon');
  });

  it('should serialize', function() {
    var region = new Midas.Region('region1');
    var serialized = region.serialize();

    expect(serialized['name']).toEqual('region1');
    expect(serialized['content']).toEqual('region1');
  });

  it('should destroy', function() {
    var region = new Midas.Region('region1');
    region.destroy();

    expect($('region1').contentEditable).toEqual('inherit');
  });
});