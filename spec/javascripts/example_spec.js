jasmine.include('midas.js');

describe('Midas', function () {

  it('should have a passing test', function() {
    expect(true).toEqual(true);
  });

  describe('nested describe', function () {

    it('should have a failing test', function () {
      expect(true).toEqual(true);
    });

  });

});