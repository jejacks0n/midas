jasmine.include('midas.js', true);

describe('Midas', function () {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  it('should have a passing test', function() {
    midas_test();
    expect(document.getElementById('test').innerHTML).toEqual('testing');
  });

  describe('nested describe', function () {

    it('should have a passing test', function () {
      expect(true).toEqual(true);
    });

  });

});