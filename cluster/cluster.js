var Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    async = require('async'),
    Article = require('../models/article.js')(DB);
    Dictionary = require('../models/dictionary.js')(DB);

console.log('Clustter Aggregator\n================');

Math.dotProduct = function (v1, v2) {
  var dot = 0, min = Math.min(Object.keys(v1).length, Object.keys(v2).length);

  for (word in v1) {
    var value = v2[word] || 0;
    dot += v1[word] * value;
  }

  return dot;
};

Math.magnitude = function (v) {

  return Math.sqrt(Math.dotProduct(v, v));
};

Math.cosineSimilarity = function (v1, v2) {
  var dotProduct = Math.dotProduct(v1, v2),
      mag1 = Math.magnitude(v1);
      mag2 = Math.magnitude(v2);
      result = dotProduct / (mag1 * mag2);

  if (isNaN(result)) {
    return 0;
  } else {
   return result;
  }
};

console.log('loading articles and dictionary...');
async.parallel([
    function (callback) {
      // Get list of articles.
      Article.find({}, function (err, articles) {
        callback(err, articles);
      });
    },
    function (callback) {
      // Get list of words and convert to a hashmap.
      Dictionary.find({}, function (err, dictionary) {
        var result = {};
        dictionary.forEach(function (item) {
          result[item.word] = item.documentFrequency;
        });
        callback(err, result);
      });
    }
  ],
  function (err, results) {
    console.log('done.');
    computeVectors({articles: results[0], dictionary: results[1]});
  }
);

var computeVectors = function (args) {
  console.log('computing vectors...');
  var vectors = {};

  var start = new Date().getTime();
  args.articles.forEach(function (article, index) {
    var vector = {};

    for (word in article.wordFrequency) {
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(args.articles.length / args.dictionary[word]);
    }

    vectors[article._id] = {vector: vector, url: article.url };
    // TODO: update article vectors;
  });
  var end = new Date().getTime();

  console.log('done in ' + (end - start) + 'ms.');

  computeSimilarityMatrix(vectors);
};

var computeSimilarityMatrix = function (vectors) {

  for (a in vectors) {
    console.log(vectors[a].url);
    for (b in vectors) {
      if (a === b) break;
      var cosine = Math.cosineSimilarity(vectors[a].vector, vectors[b].vector);
      if (cosine >= 0.3)
        console.log('\t', vectors[b].url, ' is ' + cosine * 100 + ' similar.');
      // console.log(Math.cosineSimilarity(vectors[a].vector, vectors[b].vector) + ', ' + b);
    }
    console.log('');
  }

};