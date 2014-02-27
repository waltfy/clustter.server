var assert = require('assert'),
    dbscan = require('../aggregator/dbscan')({ data: {} });

suite('dbscan', function() {
  test('dot product of vectors {a:1, b:2, c:3} • {a:3, b:2, c:1} equals 10', function () {
    assert.equal(10, Math.dotProduct({ a: 1, b: 2, c: 3 }, { a: 3, b: 2, c: 1 }));
  });

  test('average of vectors [{a: 10, b: 20, c: 30},{a: -0.5, b: 102.5}, {a: 0.3, b: 0.4, c: 1}]', function () {
    assert.deepEqual({a: 3.266666666666667, b: 40.96666666666667}, Math.averageVector([{a: 10, b: 20, c: 30},{a: -0.5, b: 102.5}, {a: 0.3, b: 0.4, c: 1}]));
  });

  test('magnitude of vector {a:10, b:3, c:-4, d:-11, e:200} equals 200.61405733397646', function () {
    assert.equal(200.61405733397646, Math.magnitude({a: 10, b: 3, c: 4, d: 11, e: 200}));
  });

  test('cosine similarity of vectors {a:1, b:2, c:3} • {a:3, b:2, c:1} equals 0.7142857142857143', function () {
    assert.equal(0.7142857142857143, Math.cosineSimilarity({ a: 1, b: 2, c: 3 }, { a: 3, b: 2, c: 1 }));
  });

});