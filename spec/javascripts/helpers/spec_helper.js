// Load up the fixtures
jasmine.include('/__spec__/fixtures/fixtures.js', true);

/**
 * Loads a given fixture file into the jasmine_content div.
 *
 * @param {String} filename of the fixture you want to load (minus the .html)
 * @static
 */
jasmine.loadFixture = function(filename) {
  if (!jasmine.fixtures[filename]) throw('Unable to load that fixture.');
  document.getElementById('jasmine_content').innerHTML = jasmine.fixtures[filename];
  // might want to eval the string here as well
};

/**
 * Loads a given css fixture file into the document.
 *
 * @param {String} filename of the css you want to load (minus the .css)
 * @static
 */
jasmine.loadCSS = function(filename) {
  if (!jasmine.css[filename]) throw('Unable to load that css.');
  if (document.getElementById('css_' + filename)) return;

  var style_node = document.createElement('div');
  style_node.setAttribute('id', 'css_' + filename);
  style_node.innerHTML = '<style>' + jasmine.css[filename] + '</style>';
  document.body.appendChild(style_node);
};

/**
 * Unloads a given css fixture file from the document.
 *
 * @param {String} filename of the css you want to load (minus the .css)
 * @static
 */
jasmine.unloadCSS = function(filename) {
  var element = document.getElementById('css_' + filename);
  if (!element) throw('That css cannot be unloaded -- not yet loaded');

  document.body.removeChild(element);
};

