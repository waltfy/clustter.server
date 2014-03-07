var assert = require('assert'),
    dbscan = require('../aggregator/dbscan')({ data: {} });

suite('dbscan', function() {
  test('dot product of vectors {a:1, b:2, c:3} • {a:3, b:2, c:1, d:2} equals 10', function () {
    assert.equal(10, Math.dotProduct({ a: 1, b: 2, c: 3 }, { a: 3, b: 2, c: 1, d: 2 }));
  });

  test('magnitude of vector {a:10, b:3, c:-4, d:-11, e:200} equals 200.61405733397646', function () {
    assert.equal(200.61405733397646, Math.magnitude({a: 10, b: 3, c: 4, d: 11, e: 200}));
  });

  test('cosine similarity of vectors {a:1, b:2, c:3} • {a:3, b:2, c:1, d:2} equals 0.7142857142857143', function () {
    assert.equal(0.629940788348712, Math.cosineSimilarity({ a: 1, b: 2, c: 3 }, { a: 3, b: 2, c: 1, d: 2 }));
  });

  test('DBScan.isVisited', function () {
    assert.equal(false, dbscan.isVisited('someid'));
    dbscan.visited.push('someid');
    assert.equal(true, dbscan.isVisited('someid'));
    dbscan.visited.pop();
    assert.equal(false, dbscan.isVisited('someid'));
  });

});