// You may load required files here, or create test-runner-wide environment settings.

// Load up the fixtures
jasmine.include('/__spec__/fixtures/fixtures.js', true);

jasmine.loadFixture = function(fixture, toElement) {
  if (!jasmine.fixtures[fixture]) throw('Unable to load that fixture.');
  document.getElementById('jasmine_content').innerHTML = jasmine.fixtures[fixture];
  // might want to eval the string here as well
};