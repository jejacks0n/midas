describe('Native Extensions', function () {

  beforeEach(function() {
    jasmine.loadFixture('native_extensions_fixture');
  });

  it('compares two NodeLists', function() {
    var div = $('div1');
    expect(typeof(div.childNodes.equals)).toEqual('function');

    expect(div.childNodes.equals($('div1').childNodes)).toEqual(true);
    expect(div.childNodes.equals($('div2').childNodes)).toEqual(false);
    expect(div.childNodes.equals($('div3').childNodes)).toEqual(false);
  });

  it('converts numbers to hex', function() {
    var number1 = 15;
    var number2 = 0;

    expect(number1.toHex()).toEqual('0F');
    expect(number2.toHex()).toEqual('00');
  });
  
  it('converts rgb strings to hex', function() {
    var string1 = 'RGB(255, 255, 255)';
    var string2 = 'rgb(0 0 0)';

    expect(string1.toHex()).toEqual('#FFFFFF');
    expect(string2.toHex()).toEqual('#000000');
  });

  it('prototypes isTop() on window', function() {
    var iframe = $('iframe1');
    iframe.contentWindow.isTop = window.isTop;

    expect(window.isTop()).toEqual(true);
    expect(iframe.contentWindow.isTop()).toEqual(false);
  });

  it('gets textnodes for DocumentFragments', function() {
    var selection = jasmine.simulate.selection($('div3'));
    var range = selection.getRangeAt(0);
    var fragment = range.cloneContents();

    var textnodes = fragment.getTextNodes();
    expect(textnodes.length).toEqual(4);
  });

  it('can find tags inside a DocumentFragment', function() {
    var selection = jasmine.simulate.selection($('div3'));
    var range = selection.getRangeAt(0);
    var fragment = range.cloneContents();

    var hasTag;
    hasTag = fragment.containsTags('span em');
    expect(hasTag).toEqual(true);

    hasTag = fragment.containsTags('font');
    expect(hasTag).toEqual(false);
  });
});