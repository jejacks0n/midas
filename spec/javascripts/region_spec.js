describe('Midas.Region', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      this.region.destroy();
      this.region = null;
    } catch(e) {}
    jasmine.unloadCSS('midas_styles');
  });

  it('should make an element editable', function() {
    this.region = new Midas.Region('region1');

    expect($('region1').contentEditable).toEqual('true');
  });

  it('should accept options in the constructor', function() {
    this.region = new Midas.Region('region1', {sandwich: 'icecream'});

    expect(this.region.options['sandwich']).toEqual('icecream');
  });

  it('should allow retrieval and update of the regions contents', function() {
    this.region = new Midas.Region('region1');

    expect(this.region.getContents()).toEqual('region1');

    this.region.setContents('bacon');
    expect(this.region.getContents()).toEqual('bacon');
  });

  it('should serialize', function() {
    this.region = new Midas.Region('region1');
    var serialized = this.region.serialize();

    expect(serialized['name']).toEqual('region1');
    expect(serialized['content']).toEqual('region1');
  });

  it('should destroy', function() {
    this.region = new Midas.Region('region1');
    this.region.destroy();

    expect($('region1').contentEditable).toEqual('false');
  });

  describe('behave according to options', function() {

    it('should support the inline option: true', function() {
      this.region = new Midas.Region('region1', {inline: true});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).not.toEqual(height);
    });

    it('should support the inline option: false', function() {
      this.region = new Midas.Region('region1', {inline: false});

      var height = this.region.element.getHeight();
      this.region.setContents(Array(100).join('<br/>'));

      expect(this.region.element.getHeight()).toEqual(height);
    });

  });

  describe('events that fire', function() {

    beforeEach(function() {
      this.spy = spyOn(Event, 'fire').andCallFake(function() {
        jasmine.log('>> Mock Event.fire called with ' + arguments.length + ' arguments...');
      });
    });

    it('should fire an event when it gets focus', function() {
      this.region = new Midas.Region('region1');

      //jasmine.simulate.focus(this.region.element); // this doesn't work in ci, but it should
      jasmine.simulate.click(this.region.element);
      expect(this.spy.callCount).toEqual(1);
    });

  });

});