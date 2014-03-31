// dependencies
var async = require('async'),
    summaryTool = require('sum'), // require('node-summary');
    titleGen = require('titlegen'),
    request = require('request');

var api = { read: 'ofGRa4pRnCvAXv2pnMirYMuaDLc' };
var name = 'summarizer';
var self = this;

var getClusters = function (cb) {
    self.models.cluster
      .find({})
      .populate({path: 'articles'})
      .lean()
      .exec(cb);
};

var summarizeClusters = function (clusters, cb) {
  async.each(clusters, createStory, function (err) {
    cb(err, clusters.length);
  });
};

var createStory = function (cluster, cb) {
  var content = [], titles = [],
      story = new self.models.story;

  // iterate through each article to acquire references, titles and content.
  cluster.articles.forEach(function (article) {
    story.refs.push(article.url);
    titles.push(article.title);
    if (content.indexOf(article.story) === -1)
      content.push(article.story);
  });

  // concatenate content
  content = content.join(' ');

  // title generation
  titlegen.feed(titles);
  if (titles.length > 1) story.title = titlegen();
  if (story.title === '' || story.title === undefined) story.title = titles[0];

  // content summarization
  story.content = summaryTool({ corpus: content, nSentences: 5 }).sentences;

  // category acquired via an api then finally save story
  request('http://uclassify.com/browse/mvazquez/News Classifier/ClassifyText?readkey=' + api.read + '&text=' + encodeURI(story.content.join('  ')) + '&output=json&version=1.01', function (err, res, body) {
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
      story.save(function (err, story) {
        console.log('new story:\n>>>>', story._id);
        cb(err);
      });
    }
  });
};

module.exports = {
  init: function (models) {
    self.models = models;
    console.log(name, '\n>>>> ready');
  },
  run: function (cb) {
    console.log(name, '\n>>>> started');
    async.waterfall([
      getClusters,
      summarizeClusters
    ], function (err, result) {
      console.log('stories:\n>>>>', result);
      console.log(name, '\n>>>> done');
      cb(err);
    });
  }
};