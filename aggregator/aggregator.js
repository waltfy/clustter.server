// aggregator class dependencies
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// aggregator dependencies
var DBScan = require('./dbscan');

// aggregator constructor
var Aggregator = function () {
  if (!(this instanceof Aggregator)) return new Aggregator(); // unsure about this?
  EventEmitter.call(this); // Calling EventEmitter constructor.

  this.clusters = new Array();
  // this.dictionary = {};
};

// enabling events
util.inherits(Aggregator, EventEmitter);

// init required params
Aggregator.prototype.init = function (args) {
  this.clusters = args.clusters;
  this.Dictionary = args.Dictionary;
  this.Cluster = args.Cluster;
}

// computes a vector based on the current article, number of articles in db and a dictionary returns a vector object.
Aggregator.prototype.computeVector = function (article, corpusSize, dictionary) {
  this.emit('status', 'computing vector');
  var vector = {}; // representing document as a vector

  for (word in article.wordFrequency) {
    if (typeof dictionary[word] === 'undefined')
      console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better

    vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(corpusSize / dictionary[word]); // tf-idf score    
  }
  // return vector; // should return the vector
  // self.vectors[article._id] = {vector: vector, url: article.url };
};

// adds a new document to the cluster body
Aggregator.prototype.add = function (args) {
  var article = args.article;
  var corpusSize = args.corpusSize;

  var self = this;
  console.log('\ncalled', arguments.callee);

  this.Dictionary.find({}).lean().exec(function (err, docs) {
    console.log(docs);
  });

  // this.Dictionary.find({}, function (err, words) {
  //   var dictionary = {};
    
  //   words.forEach(function (item) {
  //     dictionary[item.word] = item.documentFrequency;
  //   });

  //   self.computeVector(article, corpusSize, dictionary);
  // });

  // var newVector = this.computeVector(article, corpusSize);
  // this.recomputeClusters();
};

// var dbscan = DBScan({data: this.vectors});
// dbscan.run(function (err, result) {});

module.exports = Aggregator;