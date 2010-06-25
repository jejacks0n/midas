//describe('Midas.Modal', function() {
//
//  beforeEach(function() {
//    jasmine.loadFixture('midas_fixture');
//    this.spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
//      options.onSuccess({responseText: '<div class="midas-modal-controls">bananas</div>'});
//    });
//  });
//
//  afterEach(function() {
//    try {
//      Midas.modal.destroy();
//    } catch(e) {}
//  });
//
//  it('initializes when methods (show) are called', function() {
//    var spy = spyOn(Midas.modal, '_initialize').andCallThrough();
//    Midas.modal();
//
//    expect(spy.callCount).toEqual(1);
//  });
//
//  it('handles options in the initialize function', function() {
//    var modal = Midas.modal('', {title: 'Banana'});
//
//    expect(modal._options['title']).toEqual('Banana');
//  });
//
//  it('builds an element structure', function() {
//    Midas.modal();
//
//    expect($('midas_modal')).not.toBeFalsy();
//    expect($('midas_modal_overlay')).not.toBeFalsy();
//    expect($$('.midas-modal-content').length).toEqual(1);
//  });
//
//  it('destroys', function() {
//    var modal = Midas.modal();
//    modal.destroy();
//
//    expect($('midas_modal')).toBeFalsy();
//    expect($('midas_modal_overlay')).toBeFalsy();
//    expect($$('.midas-modal-content').length).toEqual(0);
//  });
//
//  it('fires events, and calls callbacks', function() {
//    var callCount = 0;
//    var callback = function() { callCount++ };
//    var modal = Midas.modal('', {beforeHide: callback});
//
//    modal.hide();
//
//    expect(callCount).toEqual(1);
//  });
//
//  it('hides', function() {
//    var modal = Midas.modal();
//
//    expect($('midas_modal_overlay').getStyle('display')).toEqual('block');
//    expect($('midas_modal').getStyle('display')).toEqual('block');
//
//    modal.hide();
//
//    expect($('midas_modal').getStyle('display')).toEqual('none');
//    expect($('midas_modal_overlay').getStyle('display')).toEqual('none');
//  });
//
//  it('copies controls into the control area (frame)', function() {
//    var modal = Midas.modal('/bananas');
//
//    expect(modal.frameElement.innerHTML).toContain('<div class="midas-modal-controls">bananas</div>');
//    expect(modal.contentElement.innerHTML).not.toContain('<div class="midas-modal-controls">bananas</div>');
//  });
//
//  it('removes the controls from the frame when hiding', function() {
//    var modal = Midas.modal();
//
//    expect(modal.frameElement.innerHTML).toContain('<div class="midas-modal-controls">bananas</div>');
//
//    modal.hide();
//
//    expect(modal.frameElement.innerHTML).not.toContain('<div class="midas-modal-controls">bananas</div>');
//  });
//
//  it('has a form', function() {
//    var modal = Midas.modal();
//
//    expect(modal.element.down('form')).toBeDefined();
//  });
//
//  it('calls a predefined method on form submission', function() {
//    var modal = Midas.modal();
//    var callCount = 0;
//    window['midas_modal_submit'] = function(e) { callCount++; e.stop(); };
//
//    var element = new Element('input', {type: 'submit'});
//    modal.frameElement.appendChild(element);
//
//    jasmine.simulate.click(element);
//
//    expect(callCount).toEqual(1);
//  });
//
//  describe('pane navigation buttons', function() {
//
//    beforeEach(function() {
//      this.removeAllSpies();
//      jasmine.loadFixture('modal_fixture');
//    });
//
//    describe('with one pane', function() {
//
//      it("doesn't create pane navigation buttons", function() {
//        this.spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
//          options.onSuccess({responseText: $('with_one_pane').innerHTML});
//        });
//        var modal = Midas.modal();
//
//        expect(modal.controls).not.toBeDefined();
//      });
//
//    });
//
//    describe('with multiple panes', function() {
//
//      beforeEach(function() {
//        this.spy = spyOn(Ajax, 'Request').andCallFake(function(url, options) {
//          options.onSuccess({responseText: $('with_two_panes').innerHTML});
//        });
//        this.modal = Midas.modal();
//      });
//
//      it('creates pane navigation buttons', function() {
//        expect(this.modal.element.down('.midas-modal-controls')).toBeDefined();
//      });
//
//      it('hides all but the first pane', function() {
//        var panes = this.modal.element.select('.midas-modal-pane');
//        expect(panes[0].getStyle('display')).toEqual('block');
//        expect(panes[1].getStyle('display')).toEqual('none');
//      });
//
//      it('disables the previous button by default', function() {
//        expect(this.modal.prevButton.disabled).toBeTruthy();
//      });
//
//      it('navigates to the next and previous pane', function() {
//        expect(this.modal.paneIndex).toEqual(0);
//        var panes = this.modal.element.select('.midas-modal-pane');
//
//        jasmine.simulate.click(this.modal.nextButton);
//
//        expect(this.modal.paneIndex).toEqual(1);
//
//        expect(panes[0].getStyle('display')).toEqual('none');
//        expect(panes[1].getStyle('display')).toEqual('block');
//
//        jasmine.simulate.click(this.modal.prevButton);
//
//        expect(panes[0].getStyle('display')).toEqual('block');
//        expect(panes[1].getStyle('display')).toEqual('none');
//      });
//
//      it('disables the previous button when moving to the first pane', function() {
//        this.modal.showPane(1);
//        expect(this.modal.prevButton.disabled).toBeFalsy();
//
//        jasmine.simulate.click(this.modal.prevButton);
//        expect(this.modal.prevButton.disabled).toBeTruthy();
//      });
//
//      it('enables the previous button when movining beyond the first pane', function() {
//        expect(this.modal.prevButton.disabled).toBeTruthy();
//
//        jasmine.simulate.click(this.modal.nextButton);
//        expect(this.modal.prevButton.disabled).toBeFalsy();
//      });
//
//      it('disables the next button when moving to the last pane', function() {
//        expect(this.modal.nextButton.disabled).toBeFalsy();
//
//        jasmine.simulate.click(this.modal.nextButton);
//
//        expect(this.modal.nextButton.disabled).toBeTruthy();
//      });
//
//      it('enables the next button when moving away from the last pane', function() {
//        this.modal.showPane(this.modal.panes.length - 1);
//        expect(this.modal.nextButton.disabled).toBeTruthy();
//
//        this.modal.prevPane();
//        expect(this.modal.nextButton.disabled).toBeFalsy();
//      });
//    });
//
//  });
//
//  stub('sets the title', function() {
//  });
//
//  stub('updates the content', function() {
//
//  });
//
//  stub('hides on escape key', function() {
//
//  });
//
//  stub('hides when the close button is pressed', function() {
//
//  });
//
//  stub('loads contents from a url', function() {
//
//  });
//
//  stub('positions itself properly', function() {
//
//  });
//});