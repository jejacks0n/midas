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

  it('should convert numbers to hex', function() {
    var number1 = 15;
    var number2 = 0;

    expect(number1.toHex()).toEqual('0F');
    expect(number2.toHex()).toEqual('00');
  });
  
  it('should convert rgb strings to hex', function() {
    var string1 = 'RGB(255, 255, 255)';
    var string2 = 'rgb(0 0 0)';

    expect(string1.toHex()).toEqual('#FFFFFF');
    expect(string2.toHex()).toEqual('#000000');
  });

});