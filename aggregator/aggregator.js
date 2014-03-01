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

  // queries database for clusters
  var getClusters = function (cb) {
    self.models.cluster.find({}).exec(function (err, clusters) {
      clusters.forEach(function (cluster) {
        clustered = clustered.concat(cluster.articles);
        self.clusters[cluster._id] = { articles: cluster.articles, vector: {} };
      });
      cb(err, self.clusters);
    });
  };

  var processUnclustered = function (cb) {
    self.models.article.find({}).lean().where('_id').nin(clustered).select('_id').exec(function (err, articles) {
      async.each(articles, function (article, done) {
        var cluster = new self.models.cluster;
        cluster.articles.push(article);
        cluster.save(function (err, cluster) { 
          self.clusters[cluster._id] = {articles: cluster.articles, vector: self.articles[article._id].vector};
          done();
        });
      }, function (err) {
        cb(err);
      });
    });
  };

  var processClustersVectors = function (cb) {
    for (cluster in self.clusters) {
      self.clusters[cluster].vector = Math.averageVector(self.clusters[cluster].articles.map(function (id) {
        return self.articles[id].vector;
      }));
    }
    cb();
  };

  // calculate vector representation of an article
  var computeVector = function (article) {
    var vector = {}; // representing document as a vector

    for (word in article.wordFrequency) {
      if (typeof dictionary[word] === 'undefined')
        console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better
      vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(corpusSize / dictionary[word]); // tf-idf score    
    }
    return vector;
  };

  var mergeClusters = function (clusters, cb) {
    var newCluster = new self.models.cluster;

    clusters.forEach(function (cluster_id) {
      self.clusters[cluster_id].articles.forEach(function (article_id) {
        newCluster.articles.push(article_id);
      });
      self.models.cluster.findOne({_id: cluster_id}).remove().exec();
    });

    newCluster.save(function (err, cluster) {
      cb(err);
    });
  };

  /* public methods */
  this.init = function (models) {
    console.log('initialising aggregator');
    this.models = models;
  };

  // runs the aggregator
  this.run = function () {
    async.series([
      getDictionary,
      getArticles,
      getClusters,
      processUnclustered,
      processClustersVectors
    ], function (err, result) {
      console.log('done');
      dbscan({data: self.clusters}).run(function (err, result) {
        async.each(Object.keys(result), function (key, done) {
          mergeClusters(result[key], done);
        },
          function (err) {
            self.emitter.emit('done');
          }
        );       
      });
    });
  };
}