var assert = require('assert'),
    scraper = require('../scraper/scraper');

suite('scraper', function () {
  
  test('normalizer removes query string and hash from url', function () {
    var url = 'http://visionmedia.github.io/mocha/#assertions?test=true'.stripQueryAndHash();
    assert.equal('http://visionmedia.github.io/mocha/', url);
  });

});