var async = require('async'),
    events = require('events')
    summarizer = require('node-summary');

module.exports = Summarizer();

function Summarizer () {
  if (!(this instanceof Summarizer)) return new Summarizer();
  var self = this;

  this.models = null;
  this.emitter = new events.EventEmitter;

  this.init = function (models) {
    this.models = models;
    console.log('summarizer... initialised');
  };

  this.run = function () {
    console.log('summarizer should run');
    this.models.cluster.find({}).populate({path: 'articles'}).exec(function (err, clusters) {
      clusters.forEach(function (cluster) {
        console.log('cluster', cluster._id);
        cluster.articles.forEach(function (article) {
          console.log('>>>>', article.url);
        });
      });
      self.emitter.emit('done');
    });
  }
}