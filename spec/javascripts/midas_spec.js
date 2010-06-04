describe('Midas', function () {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    jasmine.loadCSS('midas_styles');
  });

  afterEach(function () {
    try {
      this.midas.destroy();
      this.midas = null;
    } catch(e) {}
    jasmine.unloadCSS('midas_styles');
  });

  it('should accept options in the constructor', function() {
    this.midas = new Midas({classname: 'not-editable'});

    expect($('region1').contentEditable).not.toEqual('true');
    expect($('region3').contentEditable).toEqual('true');
  });

  it('should use the default configuration', function() {
    this.midas = new Midas();

    expect(this.midas.options.configuration).toEqual(Midas.Config);
  });

  it('should allow the configuration to be provided in the options', function() {
    var config = { actions: {}, buttons: {} };
    this.midas = new Midas({configuration: config});

    expect(this.midas.options.configuration).toEqual(config);
  });

  it("should pass it's configuration along to the toolbar and regions", function() {
    var config = { actions: {}, buttons: {} };
    this.midas = new Midas({configuration: config});

    expect(this.midas.toolbar.options.configuration).toEqual(config);
    expect(this.midas.regions[0].options.configuration).toEqual(config);
  });

  it('should only instantiate if a browser has contentEditable features', function() {
    spyOn(Midas, 'agentIsCapable').andCallFake(function() {
      return false;
    });
    try { this.midas = new Midas(); } catch(e) {
      expect(e.toString()).toEqual('Midas requires a browser that has contentEditable features');
    }

    expect(this.midas).toBeUndefined();
  });

  it('should make all regions with the editable class editable', function() {
    this.midas = new Midas();

    expect($('region1').contentEditable).toEqual('true');
    expect($('region2').contentEditable).toEqual('true');
    expect($('region3').contentEditable).not.toEqual('true'); // will default to 'inherit' if not specified
  });

  it('should assign all editable regions to member variables', function() {
    this.midas = new Midas();

    expect(this.midas.regions.length).toEqual($$('.editable').length);
    expect(this.midas.regionElements).toContain($('region1'));
    expect(this.midas.regionElements).toContain($('region2'));
  });

  it('should destroy', function() {
    this.midas = new Midas();
    this.midas.destroy();

    expect(this.midas.toolbar).toEqual(null);
    expect(this.midas.regions).toEqual([]);
  });

  describe('static methods', function () {

    it('should track instances of itself', function() {
      var midas1 = new Midas();
      var midas2 = new Midas();
      var midas3 = new Midas();

      expect(Midas.instances.length).toEqual(3);

      midas2.destroy();
      expect(Midas.instances.length).toEqual(2);

      midas1.destroy();
      expect(Midas.instances.length).toEqual(1);

      midas3.destroy();
      expect(Midas.instances.length).toEqual(0);

      midas1 = null;
      midas2 = null;
      midas3 = null;
    });

    it('should handle filtering calls from events', function() {
      runs(function() {
        this.callCount = 0;
        this.spyFunction = function() { this.callCount += 1 }.bind(this);
        Midas.filterCall(this.spyFunction);
        Midas.filterCall(this.spyFunction);
      });

      waits(100);

      runs(function() {
        Midas.filterCall(this.spyFunction);
        expect(this.callCount).toEqual(2);
      });
    });

    describe('for detecting the browser', function () {

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

  });

  describe('when saving', function () {

    beforeEach(function() {
      this.spy = spyOn(Ajax, 'Request').andCallFake(function() {
        jasmine.log('>> Mock Ajax.Request called with ' + arguments.length + ' arguments...');
      });
    });

    it('should call serialize on the regions', function () {
      this.midas = new Midas();
      spyOn(this.midas.regions[1], 'serialize').andCallFake(function() {
        return {name: 'banana', content: 'juice'};
      });
      this.midas.save();

      expect(this.midas.regions[1].serialize).wasCalled();
    });

    describe('using put (updating)', function() {

      it('should generate an ajax request', function () {
        this.midas = new Midas({
          saveUrl: '/peanuts',
          saveMethod: 'put'
        });
        this.midas.save();

        expect(Ajax.Request).wasCalledWith('/peanuts', {
          method: 'put',
          parameters: {
            _method: 'put',
            region1: 'region1',
            region2: 'region2',
            region4: $('region4').innerHTML.replace(/^\s+|\s+$/g, "")
          }
        });
      });

    });

    describe('using post (creating)', function() {

      it('should generate an ajax request', function () {
        this.midas = new Midas({
          saveUrl: '/oranges',
          saveMethod: 'post'
        });
        this.midas.save();

        expect(Ajax.Request).wasCalledWith('/oranges', {
          method: 'post',
          parameters: {
            region1: 'region1',
            region2: 'region2',
            region4: $('region4').innerHTML.replace(/^\s+|\s+$/g, "")
          }
        });
      });

    });

  });

  describe('events that are observed', function () {

    it('should understand context and highlight buttons', function() {
      runs(function() {
        this.midas = new Midas();
        this.midas.regions[0].focused = true;

        var span = $('div6').down('span');
        jasmine.simulate.selection(span);

        Event.fire(document, 'midas:region', {region: this.midas.regions[0], name: 'name', event: {}});
        expect(this.midas.toolbar.element.down('.midas-button-bold').hasClassName('active')).toEqual(true);
      });

      waits(100);

      runs(function() {
        var em = $('div3').down('em');
        jasmine.simulate.selection(em);

        Event.fire(document, 'midas:region', {region: this.midas.regions[0], name: 'name', event: {}});

        expect(this.midas.toolbar.element.down('.midas-button-bold').hasClassName('active')).toEqual(false);
        expect(this.midas.toolbar.element.down('.midas-button-italic').hasClassName('active')).toEqual(true);
      });
    });

    it('should know which region has focus', function() {

      // focus() doesn't seem to work well in ci.. works fine in browser though.
      // I tried runs, waits, and changing the element that was being observed /
      // fired on, but no luck...using click instead of focus for now.

      runs(function() {
        this.midas = new Midas();

        jasmine.simulate.click(this.midas.regions[1].element);
        expect(this.midas.activeRegion.name).toEqual(this.midas.regions[1].name);
      });

      waits(100);

      runs(function() {
        jasmine.simulate.click(this.midas.regions[1].element);
        expect(this.midas.activeRegion.name).toEqual(this.midas.regions[1].name);
      });

      waits(100);
    });

    it('should handle and pass any button clicks to the active region', function() {
      runs(function() {
        this.midas = new Midas();

        this.midas.activeRegion = this.midas.regions[0];

        var spy1 = spyOn(this.midas.activeRegion, 'handleAction');
        var spy2 = spyOn(this.midas, 'handleAction');

        jasmine.simulate.click($$('.midas-button-insertorderedlist')[0]);
        expect(spy1.callCount).toEqual(1);
        expect(spy2.callCount).toEqual(1);
      });

      waits(100);
    });

    it('should handle switching modes', function() {
      runs(function() {
        this.midas = new Midas();
        this.midas.activeRegion = this.midas.regions[0];

        var spy = spyOn(this.midas, 'handleMode').andCallThrough();

        jasmine.simulate.click($$('.midas-button-preview')[0]);
        expect(spy.callCount).toEqual(1);
      });

      waits(100);
    });

  });

});