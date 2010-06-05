// Load up the fixtures
jasmine.include('/__spec__/fixtures/fixtures.js', true);


/**
 * Logs the given string to the current logger.
 *
 * @param {String} string to log
 * @static
 */
jasmine.log = function(string) {
  var env = jasmine.getEnv();
  env.reporter.log(string);
};

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









// stub functionality
jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
  var results = spec.results();
  var status = results.passed() ? 'passed' : 'failed';
  var style = '';
  if (results.skipped) {
    status = 'skipped';
  }
  if (results.failedCount == 0 && results.passedCount == 0 && !results.skipped) {
    status = 'stubbed';
    style = "background-color: #FFA200; border: 1px solid #000000";
  }
  var specDiv = this.createDom('div', { className: 'spec '  + status, style: style },
      this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(spec.getFullName()) }, "run"),
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description));


  var resultItems = results.getItems();
  var messagesDiv = this.createDom('div', { className: 'messages' });
  for (var i = 0; i < resultItems.length; i++) {
    var result = resultItems[i];
    if (result.passed && !result.passed()) {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, result.message));

      if (result.trace.stack) {
        messagesDiv.appendChild(this.createDom('div', {className: 'stackTrace'}, result.trace.stack));
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    specDiv.appendChild(messagesDiv);
  }

  this.suiteDivs[spec.suite.getFullName()].appendChild(specDiv);
};

var stub = function(desc, func) {
  return jasmine.getEnv().stub(desc, func);
};

jasmine.Env.prototype.stub = function(description, func) {
  var spec = new jasmine.Spec(this, this.currentSuite, description);
  this.currentSuite.add(spec);
  this.currentSpec = spec;

  if (func) {
    spec.stub(func);
  }

  return spec;
};

jasmine.Spec.prototype.stub = function (e) {
  var expectationResult = new jasmine.MessageResult('stubbed');
  this.results_.addResult(expectationResult);
};
