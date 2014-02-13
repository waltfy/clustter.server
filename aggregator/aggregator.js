// dbscan
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

async.parallel([
    function (callback) {
      // Get list of articles.
      console.log('loading articles...');
      Article.find({}, function (err, articles) {
        callback(err, articles);
      });
    },
    function (callback) {
      // Get list of words and convert to a hashmap.
      console.log('loading dictionary...');
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
      if (args.dictionary[word] === undefined)
        console.log('[WARN]:', word, '-', 'not in dictionary');
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(args.articles.length / args.dictionary[word]);
    }

    vectors[article._id] = {vector: vector, url: article.url };
    // TODO: update article vectors;
  });
  var end = new Date().getTime();

  console.log('done in ' + (end - start) + 'ms.');

  // computeSimilarityMatrix(vectors);
};

var computeSimilarityMatrix = function (vectors) {


  var matrix = {};
  var count = 0;
  
  var start = new Date().getTime();
  for (id1 in vectors) {

    matrix[id1] = {};

    for (id2 in vectors) {
      var similiarity = 0;

      if (matrix[id2] !== undefined && matrix[id2].hasOwnProperty(id1)) {
        similiarity = matrix[id2][id1];
      } else if (id1 === id2) {
        similiarity = 1;
      } else {
        count++;
        similiarity = Math.cosineSimilarity(vectors[id1].vector, vectors[id2].vector);

      }

      matrix[id1][id2] = similiarity;    

    //   // console.log('\t', vectors[id2].url, ' is ' + cosine * 100 + ' similar.');
    //   // console.log(Math.cosineSimilarity(vectors[id1].vector, vectors[id2].vector) + ', ' + id2);
    }
  }

  var end = new Date().getTime();

  // console.log('Calculated comparison matrix for', Object.keys(matrix).length, 'articles in:', (end - start), 'ms.');
  // console.log('Performed', count, 'operations.');
};