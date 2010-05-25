describe('Native Extensions', function () {

  beforeEach(function() {
    jasmine.loadFixture('native_extensions_fixture');
  });

  it('should compare two NodeLists', function() {
    var div = $('div1');
    expect(typeof(div.childNodes.equals)).toEqual('function');

    expect(div.childNodes.equals($('div1').childNodes)).toEqual(true);
    expect(div.childNodes.equals($('div2').childNodes)).toEqual(false);
    expect(div.childNodes.equals($('div3').childNodes)).toEqual(false);
  });

});