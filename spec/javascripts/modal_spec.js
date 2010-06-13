describe('Midas.Modal', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
    this.spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
      options.onSuccess({responseText: ''});
    });
  });

  afterEach(function() {
    try {
      Midas.modal.destroy();
    } catch(e) {}
  });

  it('should initialize when methods (show) are called', function() {
    var spy = spyOn(Midas.modal, '_initialize').andCallThrough();
    Midas.modal();

    expect(spy.callCount).toEqual(1);
  });

  it('should handle options in the initialize function', function() {
    var modal = Midas.modal('', {title: 'Banana'});

    expect(modal.options['title']).toEqual('Banana');
  });

  it('should build an element structure', function() {
    Midas.modal();

    expect($('midas_modal')).not.toBeFalsy();
    expect($('midas_modal_overlay')).not.toBeFalsy();
    expect($$('.midas-modal-content').length).toEqual(1);
  });

  it('should destroy', function() {
    var modal = Midas.modal();
    modal.destroy();

    expect($('midas_modal')).toBeFalsy();
    expect($('midas_modal_overlay')).toBeFalsy();
    expect($$('.midas-modal-content').length).toEqual(0);
  });

  it('should fire events, and call callbacks', function() {
    var callCount = 0;
    var callback = function() { callCount++ };
    var modal = Midas.modal('', {beforeHide: callback});

    modal.hide();

    expect(callCount).toEqual(1);
  });

  it('should hide', function() {
    var modal = Midas.modal();

    expect($('midas_modal_overlay').getStyle('display')).toEqual('block');
    expect($('midas_modal').getStyle('display')).toEqual('block');

    modal.hide();

    expect($('midas_modal').getStyle('display')).toEqual('none');
    expect($('midas_modal_overlay').getStyle('display')).toEqual('none');
  });

  stub('should set the title', function() {

  });

  stub('should update', function() {

  });

  stub('should hide on escape key', function() {

  });

  stub('should hide when the close button is pressed', function() {

  });

  stub('should load contents from a url', function() {

  });

  stub('should position itself properly', function() {

  });
});