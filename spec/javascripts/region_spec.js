describe('Midas.Region', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      window.region.destroy();
      window.region = null;
    } catch(e) {}
    jasmine.unloadCSS('midas_styles');
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

  it('should support the inline option', function() {
    var region_inline = new Midas.Region('region1', {inline: true});
    var region_fixed = new Midas.Region('region2', {inline: false});

    var height_inline = region_inline.element.getHeight();
    var height_fixed = region_fixed.element.getHeight();
    region_inline.setContents(Array(100).join('<br/>'));
    region_fixed.setContents(Array(100).join('<br/>'));

    expect(region_inline.element.getHeight()).not.toEqual(height_inline);
    expect(region_fixed.element.getHeight()).toEqual(height_fixed);
  });

  it('should fire an event when it gets focus', function() {
    var region = new Midas.Region('region1');

    var spy = spyOn(Event, 'fire').andCallFake(function() {
      jasmine.log('>> Mock Event.fire called...');
    });

    jasmine.simulate.focus(region.element);
    expect(spy.callCount).toEqual(1);
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

    expect($('region1').contentEditable).toEqual('false');
  });
});