// dbscan
var Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    async = require('async'),
    Article = require('../models/article.js')(DB);
    Dictionary = require('../models/dictionary.js')(DB),
    DBScan = require('./dbscan');

console.log('Clustter Aggregator\n================');

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

  var start = new Date().getTime(); // benchmarking

  // representing each document as a vector
  args.articles.forEach(function (article, index) {
    var vector = {};

    for (word in article.wordFrequency) {
      
      if (args.dictionary[word] === undefined) {
        console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better
      }
        
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(args.articles.length / args.dictionary[word]);
    }

    vectors[article._id] = {vector: vector, url: article.url };

  });

  var end = new Date().getTime();  // benchmarking
  console.log('done in ' + (end - start) + 'ms.');

  var dbscan = DBScan({data: vectors});

  dbscan.run(function (err, result) {
    console.log('result');
    console.log(Object.keys(result).length);
    for (cluster in result) {
      console.log('cluster', cluster);
      result[cluster].forEach(function (doc) {
        console.log('>>>>', vectors[doc].url);
      });
      console.log('<<<<<<<<<<<<<<<<<');
    }
  });
};