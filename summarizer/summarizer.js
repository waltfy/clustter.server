var async = require('async'),
    events = require('events'),
    summaryTool = require('sum'), // require('node-summary');
    titleGen = require('titlegen'),
    request = require('request');

module.exports = Summarizer();

function Summarizer () {
  if (!(this instanceof Summarizer)) return new Summarizer();
  var self = this;
  var classifierApi = { read: 'ofGRa4pRnCvAXv2pnMirYMuaDLc' };

  this.models = null;
  this.clusters = null;
  this.emitter = new events.EventEmitter;

  var getClusters = function (cb) {
    self.models.cluster.find({}).populate({path: 'articles'}).exec(function (err, clusters) {
      self.clusters = clusters;
      cb(err, self.clusters);
    });
  };

  var createStory = function (cluster, cb) {
    var content = '', titles = [],
        story = new self.models.story;

    cluster.articles.forEach(function (article) {
      story.refs.push(article.url);
      titles.push(article.title);
      content += article.story;
    });

    titlegen.feed(titles);

    (titles.length > 1) ? story.title = titlegen() : story.title = titles[0];
    if (story.title === '')
      story.title = 'bad story';

    story.content = summaryTool({ corpus: content, nSentences: (cluster.articles.length * 2) }).sentences;

    request('http://uclassify.com/browse/mvazquez/News Classifier/ClassifyText?readkey=' + classifierApi.read + '&text=' + encodeURI(story.content.join('  ')) + '&output=json&version=1.01', function (err, res, body) {
      var response, category;
      try {
        response = JSON.parse(body);
        var categories = [];
      
        for (var c in response.cls1)
          categories.push([c, response.cls1[c]]);
        categories.sort(function(a, b) {return b[1] - a[1]});

        story.category = ((categories[0][0] === 'US') ? 'UK & Others' : categories[0][0]);

      } catch (e) {
        console.log(new Error('Could not set category.'));
        story.category = 'Miscellaneous';
      } finally {
        story.save(cb);
      }
    });
  };

  var summarizeClusters = function (cb) {
    async.each(self.clusters, createStory, function (err) {
      cb(err, 'stories summarized');
    });
  };

  this.init = function (models) {
    this.models = models;
    console.log('summarizer... initialised');
  };

  this.run = function () {
    console.log('summarizer running');
    async.series([
      getClusters,
      summarizeClusters
    ], function (err, results) {
      console.log(results[0].length); // clusters
      self.emitter.emit('done');
    });
  }
}