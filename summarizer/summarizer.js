// dependencies
var API_KEYS = require('./api_keys.json'), // static file containing keys
    tiglegen = require('titlegen'),
    twitter = require('twitter'),
    request = require('request'),
    cosine = require('cosine'),
    async = require('async'),
    // topSentences = require('node-summary'),
    sum = require('sum');

// twitter client configuration
var tweet = new twitter({
  consumer_key: API_KEYS.twitter.consumer_key,
  consumer_secret: API_KEYS.twitter.consumer_secret,
  access_token_key: API_KEYS.twitter.access_token_key,
  access_token_secret: API_KEYS.twitter.access_token_secret
});

var name = 'summarizer', // module name
    self = this; // referencing this safely

// private: Retrievs clusters from database
var getClusters = function (cb) {
  self.models.cluster
    .find({})
    .populate({path: 'articles'})
    .lean()
    .exec(cb);
};

// private: summarises each cluster into a story
var summarizeClusters = function (clusters, cb) {
  async.each(clusters, createStory, function (err) {
    cb(err, clusters.length);
  });
};

// private: composes the story
var createStory = function (cluster, cb) {
  var story = new self.models.story;
  var text = '';
  var summary = [];
  var titles = [];

  // extraction of relevant sentences
  cluster.articles.forEach(function (article) {
    story.refs.push(article.url);
    titles.push(article.title);
    text += article.story;
  });

  // title generation
  titlegen.feed(titles);
  if (titles.length > 1) story.title = titlegen();
  if (story.title === '' || story.title === undefined) story.title = titles[0];

  story.content = removeRedundancy(sum({corpus: text, nSentences: 5}).sentences); // setting the content of the story

  // classifier access via api, finally saving the story
  request('http://uclassify.com/browse/mvazquez/News Classifier/ClassifyText?readkey=' + API_KEYS.classifier.read + '&text=' + encodeURI(story.content.join('  ')) + '&output=json&version=1.01', function (err, res, body) {
    var response, category;
    try {
      response = JSON.parse(body);
      var categories = [];
    
      for (var c in response.cls1)
        categories.push([c, response.cls1[c]]);

      categories.sort(function (a, b) {return b[1] - a[1]});

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

// private: performs novelty detection on each phrase
var removeRedundancy = function (summary) {
  summary.forEach(function (sentence) {
    for (var next in summary) {
      var redundant = summary[next];
      if (sentence === redundant) continue;
      else {
        var similarity = cosine(sentence.split(/\s/), redundant.split(/\s/));
        if (similarity > 0.4)
          summary.splice(summary.indexOf(redundant), 1);
      }
    }
  });
  return summary;
};

// private: responsible for tweeting at the completion of summarisation
var tweetStatus = function (stories, cb) {
  if (process.env.NODE_ENV !== 'production') return cb();
  var message = 'New story feed available with ' + stories + ' new stories - http://www.clustter.in. #clustter';
  tweet
    .updateStatus(message, function (data) {
      console.log('updated twitter status');
      cb();
    });
};

// public
module.exports = {
  init: function (models) {
    self.models = models;
    console.log(name, '\n>>>> ready');
  },
  run: function (cb) {
    console.log(name, '\n>>>> started');
    async.waterfall([
      getClusters,
      summarizeClusters,
    ], function (err, result) {
      console.log('stories:\n>>>>', result);
      console.log(name, '\n>>>> done', new Date());
      tweetStatus(result, function (data) {
        cb(err);  
      });
    });
  }
};