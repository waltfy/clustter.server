// dependencies
var dbscan = require('./dbscan'),
    async = require('async');

var name = 'aggregator';
var self = this;

var dictionary = {},
    articles = {},
    corpus = null;

var tf = function (word, article) {
  return article.wordFrequency[word] / article.wordCount;
};

var idf = function (word, corpus) {
  return Math.log(corpus / dictionary[word]);
};

var computeDictionary = function (cb) {
  self.models.article
    .find({})
    .select('wordFrequency')
    .lean()
    .exec(function (err, articles) {
      async.each(articles, function (article, done) {
        for (word in article.wordFrequency)
          (dictionary[word]) ? dictionary[word] += 1 : dictionary[word] = 1;  
        done();
      }, function (err) {
        cb(err, Object.keys(dictionary).length);
      });
    });
};

var computeVectors = function (cb) {
  self.models.article
    .find({})
    .lean()
    .exec(function (err, docs) {
      async.each(docs, function (doc, done) {
        articles[doc._id] = { vector: toVector(doc, docs.length), url: doc.url };
        done();
      }, function (err) {
        // require('fs').writeFile("./articles.json", JSON.stringify(articles, null, 2), console.log.bind(console, 'saved articles')); // use this to output a sample of articles as vectors
        cb(err, Object.keys(articles).length);  
      });
    });
};

// creates clusters by running dbscan
var clusterVectors = function (cb) {
  dbscan.run({ data: articles }, function (err, clusters) {
    async.each(Object.keys(clusters), function (key, done) {
      createCluster(clusters[key], done);
    }, function (err) {
      cb(err, Object.keys(clusters).length);
    });
  });
};

// creates a clustter
var createCluster = function (cluster, cb) {
  var c = new self.models.cluster;
  cluster.forEach(function (article) {
    c.articles.push(article);
  });
  c.save(cb);
};

// calculate vector representation of an article
var toVector = function (article, corpus) {
  var vector = {}; // representing document as a vector
  for (var word in article.wordFrequency) {
    vector[word] = tf(word, article) * idf(word, corpus); // tf-idf score
    if (typeof dictionary[word] === 'undefined')
      console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better
  }
  return vector;
};

// public methods + properties
module.exports = {
  name: 'aggregator',
  init: function (models) {
    self.models = models;
    console.log(name, '\n>>>> ready');
  },
  run: function (cb) {
    console.log(name, '\n>>>> started');
    async.series([
      computeDictionary,
      computeVectors,
      clusterVectors,
    ], function (err, result) {
      console.log('dictionary size:\n>>>>', result[0]);
      console.log('vectors:\n>>>>', result[1]);
      console.log('clusters:\n>>>>', result[2]);
      console.log(name, '\n>>>> done', new Date());
      cb(err);
    });
  }
};