module.exports = Aggregator();

function Aggregator () {
  if (!(this instanceof Aggregator)) return new Aggregator();
  
  // dependencies
  var dbscan = require('./dbscan'),
      events = require('events'),
      async = require('async');

  /* private vars */
  var self = this,
      clustered = [],
      corpusSize = null,
      dictionary = {};

  /* public vars */
  this.emitter = new events.EventEmitter;
  this.models = null;
  this.articles = {};

  /* private methods */
  // queries database for dictionary
  var getDictionary = function (cb) {
    self.models.dictionary.find({}).exec(function (err, words) {
      words.forEach(function (item) {
        dictionary[item.word] = item.documentFrequency;
      });
      cb(err, dictionary);
    });
  };

  // queries database and sets the corpusSize and local copy of articles
  var getArticles = function (cb) {
    self.models.article.find({}).exec(function (err, articles) {
      corpusSize = articles.length;
      articles.forEach(function (article) {
        self.articles[article._id] = {vector: computeVector(article), url: article.url}
      });
      cb(err, self.articles);
    });
  };

  // calculate vector representation of an article
  var computeVector = function (article) {
    var vector = {}; // representing document as a vector
    for (var word in article.wordFrequency) {
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(corpusSize / dictionary[word]); // tf-idf score
      if (typeof dictionary[word] === 'undefined')
        console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better
    }
    return vector;
  };

  var createCluster = function (cluster, cb) {
    var c = new self.models.cluster;
    cluster.forEach(function (article) {
      c.articles.push(article);
    });
    c.save(cb);
  };

  // creates clusters
  var clusterVectors = function () {
    dbscan({data: self.articles}).run(function (err, clusters) {
      
      async.each(Object.keys(clusters), function (key, done) {
        createCluster(clusters[key], done);
      }, function (err) {
        console.log('created clusters');
        self.emitter.emit('done');
      });
      
    });
  };

  /* public methods */
  // initialises the aggregator
  this.init = function (models) {
    console.log('aggregator... initialised');
    this.models = models;
  };

  // runs the aggregator
  this.run = function () {
    async.series([
      getDictionary,
      getArticles
    ], function (err, result) {
      clusterVectors();
    });
  };
}