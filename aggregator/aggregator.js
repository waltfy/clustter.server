// events
var events = require('events');
var emitter = new events.EventEmitter;

// aggregator dependencies
var DBScan = require('./dbscan');

// aggregator constructor
var Aggregator = function () {
  if (!(this instanceof Aggregator)) return new Aggregator(); // unsure about this?

  this.clusters = new Array();
  // this.dictionary = {};
};

// init required params
Aggregator.prototype.init = function (args) {
  this.clusters = args.clusters;
  this.Dictionary = args.Dictionary;
  this.Cluster = args.Cluster;
  emitter.emit('running');
}

// computes a vector based on the current article, number of articles in db and a dictionary returns a vector object.
Aggregator.prototype.computeVector = function (article, corpusSize, dictionary) {
  sharedEvents.emit('status', 'computing vector');
  var vector = {}; // representing document as a vector

  for (word in article.wordFrequency) {
    if (typeof dictionary[word] === 'undefined')
      console.log('[WARN]:', word, '-', 'not in dictionary'); // need to handle it better

    vector[word] = (article.wordFrequency[word] / article.wordCount) * Math.log(corpusSize / dictionary[word]); // tf-idf score    
  }
  console.log(vector);
  // return vector; // should return the vector
  // self.vectors[article._id] = {vector: vector, url: article.url };
};

// adds a new document to the cluster body
Aggregator.prototype.add = function (article) {
  // var article = args.article;
  // var corpusSize = args.corpusSize;

  var self = this;
  
  this.Dictionary.find({}, function (err, words) {
    var dictionary = {};
    console.log('managed to get dictionary');
    // words.forEach(function (item) {
    //   dictionary[item.word] = item.documentFrequency;
    // });
  });

  // self.computeVector(article, corpusSize, dictionary);
  // var newVector = this.computeVector(article, corpusSize);
  // this.recomputeClusters();
};

// var dbscan = DBScan({data: this.vectors});
// dbscan.run(function (err, result) {});

module.exports = {
  init: function (args) {
    var a = new Aggregator();
    a.init(args);
  },
  emitter: emitter
};