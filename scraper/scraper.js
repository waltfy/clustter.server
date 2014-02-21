// events
var events = require('events');
var emitter = new events.EventEmitter;

// scraper dependencies
var HtmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    Extractor = require('article'),
    Keywords = require("keyword-extractor"),
    Request = require('request');


var template = [];
var scraped = [];
var roots = [];
var visited = [];

var Article = null;
var Dictionary = null;

// removes querystring and hash from url
String.prototype.stripQueryAndHash = function () {

  return this.split('?')[0].split('#')[0];
};

// checks for internet connection returning a boolean
var checkConnection = function (callback) {
  require('dns').resolve('www.google.com', function (err) {
    if (err) return callback(false); //emitter.emit('status', 'no internet connection');
    return callback(true);
  });
};

// runs the scraper
var run = function () {
  
  var self = this;
  var crawler = new Crawler({
    callback: function (err, result, $) {
      var url = this.uri;
      var toCrawl = [];

      emitter.emit('status', 'scraping links');
      $('a').each(function (index, a) {
        var link = a.href.stripQueryAndHash();
        // if it matches the link structure and is not already on the queue and it hasn't been scraped yet
        if (link.match(template) && toCrawl.indexOf(link) === -1 && visited.indexOf(link) === -1 && scraped.indexOf(link) === -1) {
          // then it should be added to queue for scraping and parsing
          toCrawl.push(link);
        }
      });

      if (roots.indexOf(url) === -1) { // scrape url for article
        Request(url) // TODO: maybe I can avoid making another request
          .on('error', function (error) {
            emitter.emit('status', 'request failed will try again later');
            crawler.queue(url); // add url to the queue again
          })
          .on('response', function () {
            visited.push(url); // visited the url
          })
          .pipe(Extractor(url, function (err, result) {
            if (err) return emitter.emit('status', err);

            var article = new Article();
            article.title = result.title;
            article.story = HtmlToText.fromString(result.text);
            article.token = Article.tokenise(article.story);
            article.wordFrequency = Article.getWordFrequency(article.token);
            article.wordCount = article.token.length //article.story.match(/\S+/g).length; which one to use?
            article.tags = Keywords.extract(article.story, { language: 'english', return_changed_case: true });
            article.url = url;

            scraped.push(url);

            article.save(function (err, article) {
              if (err) return emitter.emit('status', err);
              else {
                Dictionary.documentFrequency(article);
                emitter.emit('article:new', article);
              }
            });
          }));
      }

      emitter.emit('status', 'adding to queue');
      crawler.queue(toCrawl);
    },
    onDrain: function () {
      emitter.emit('drained');
      // Should trigger the clustering algorithm queue is empty: true
    }
  });
  crawler.queue('http://www.bbc.co.uk/news/technology-26272936');
  // crawler.queue(this.roots); // adding roots
};

module.exports = {
  init: function (args) {
    args.robots.forEach(function (robot) { // load configs from robots
      template.push(robot.template); // loading templates
      roots.push(robot.root); // loading roots
    });

    args.articles.forEach(function (article) { // load configs from articles
      scraped.push(article.url); // loading previously scraped urls
    });

    Article = args.Article; // article model
    Dictionary = args.Dictionary; // dictionary model
    // template = new RegExp(this.template.join('|')); // creates a single regular expression using the or operator.

    checkConnection(function (connected) {
      if (connected)
        run(); // finally run the scraper
      else
        emitter.emit('status', 'no internet');
    });
  },
  emitter: emitter
};