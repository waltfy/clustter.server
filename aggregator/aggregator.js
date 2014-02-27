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
  this.clusters = {};

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

  // queries database for clusters
  var getClusters = function (cb) {
    self.models.cluster.find({}).populate({path: 'articles'}).exec(function (err, clusters) {
      clusters.forEach(function (cluster) {
        clustered = clustered.concat(cluster.articles.map(function (article) { return article._id }));
        self.clusters[cluster._id] = { articles: cluster.articles, vector: {} };
      });
      cb(err, self.clusters);
    });
  };

  var getCorpusSize = function (cb) {
    self.models.article.count(function (err, count) {
      corpusSize = count;
      cb(err, count);
    });
  };

  var getAverageVector = function (cb) {
    async.each(Object.keys(self.clusters), function (k, done) {
      var vectors = self.clusters[k].articles.map(function (article) {
        return computeVector(article);
      });

      self.clusters[k].vector = Math.averageVector(vectors);
      done();
    }, function (err) {
      cb(err);
    });
  };

  var computeVector = function (article) {
    var vector = {}; // representing document as a vector

    for (word in article.wordFrequency) {
      if (typeof dictionary[word] === 'undefined')
        console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(corpusSize / dictionary[word]); // tf-idf score    
    }
    return vector;
  };

  // creates cluster for unclustered articles
  var createCluster = function (article, cb) {
    var cluster = new self.models.cluster;
    cluster.articles.push(article);
    cluster.vector = {};

    cluster.save(function (err, cluster) {
      console.log('saved cluster:', cluster._id);
      self.clusters[cluster._id] = { articles: cluster.articles, vector: {} };
      cb(err);
    });
  };

  // returns all unclustered articles
  var getUnclustered = function (cb) {
    self.models.article.find({}).where('_id').nin(clustered).exec(function (err, articles) {
      async.each(articles, function (article, done) {
        createCluster(article, done);
      }, function (err) {
        cb(err);
      });
    });
  }

  /* public methods */
  this.init = function (models) {
    console.log('initialising aggregator');
    this.models = models;
  };

  // runs the aggregator
  this.run = function () {
    async.series([
      getCorpusSize,
      getDictionary,
      getClusters,
      getUnclustered,
      getAverageVector
    ], function (err, result) {
      console.log('dictionary size:', Object.keys(dictionary).length);
      console.log('corpus size:', corpusSize);
      console.log('clusters:', Object.keys(self.clusters).length);
      console.log('clustered docs:', clustered.length);
      // dbscan({data: self.clusters}).run(function (err, result) {
      //   console.log(result);
      //   self.emitter.emit('done');
      // });
    });
  };
}