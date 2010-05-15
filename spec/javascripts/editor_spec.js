jasmine.include('midas/midas.js', true);
jasmine.include('midas/editor.js', true);
jasmine.include('midas/toolbar.js', true);

describe('Midas.Editor', function() {

  beforeEach(function() {
    jasmine.loadFixture('midas_fixture');
  });

  it('should make an element editable', function() {
    var editor = new Midas.Editor('region1');

    expect($('region1').contentEditable).toEqual('true');
  });

  it('should accept options in the constructor', function() {
    var editor = new Midas.Editor('region1', {sandwich: 'icecream'});

    expect(editor.options['sandwich']).toEqual('icecream');
  });

  it('should allow retrieval and update of the regions contents', function() {
    var editor = new Midas.Editor('region1');

    expect(editor.getContents()).toEqual('region1');

    editor.setContents('bacon');

    expect(editor.getContents()).toEqual('bacon');
  });

  it('should serialize', function() {
    var editor = new Midas.Editor('region1');
    var serialized = editor.serialize();

    expect(serialized['name']).toEqual('region1');
    expect(serialized['content']).toEqual('region1');
  });

  it('should destroy', function() {
    var editor = new Midas.Editor('region1');
    editor.destroy();

    expect($('region1').contentEditable).toEqual('inherit');
  });
});