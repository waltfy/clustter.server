// scraper class dependencies
var util = require('util');
var EventEmitter = require('events').EventEmitter;

// scraper dependencies
var HtmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    Extractor = require('article'),
    Keywords = require("keyword-extractor"),
    Request = require('request');

// scraper constructor
var Scraper = function () {
  if (!(this instanceof Scraper)) return new Scraper(); // unsure about this?
  EventEmitter.call(this); // Calling EventEmitter constructor.

  this.template = new Array();
  this.roots = new Array();
  this.scraped = new Array();
  this.visited = new Array();
};

util.inherits(Scraper, EventEmitter);

// removes querystring and hash from url
String.prototype.stripQueryAndHash = function () {
  
  return this.split('?')[0].split('#')[0];
};

// checks for internet connection returning a boolean
Scraper.prototype.checkConnection = function () {
  var connection = true;
  var self = this;
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
      // self.emit('status', 'no internet connection');
      connection = false;
      // process.exit(0);
    }
  });
  return connection;
};

// init required params
Scraper.prototype.init = function (args) {
  var self = this;

  args.robots.forEach(function (robot) { // load configs from robots
    self.template.push(robot.template); // loading templates
    self.roots.push(robot.root); // loading roots
  });

  args.articles.forEach(function (article) { // load configs from articles
    self.scraped.push(article.url); // loading previously scraped urls
  });

  this.Article = args.Article; // article model
  this.Dictionary = args.Dictionary; // dictionary model
  this.template = new RegExp(this.template.join('|')); // creates a single regular expression using the or operator.

  if (this.checkConnection()) // if we have internet connection we can run
    this.run(); // finally run the scraper
};

// runs the scraper
Scraper.prototype.run = function () {
  
  var self = this;
  var crawler = new Crawler({
    callback: function (err, result, $) {
      var url = this.uri;
      var toCrawl = [];

      self.emit('status', 'scraping links');
      $('a').each(function (index, a) {
        var link = a.href.stripQueryAndHash();
        // if it matches the link structure and is not already on the queue and it hasn't been scraped yet
        if (link.match(self.template) && toCrawl.indexOf(link) === -1 && self.visited.indexOf(link) === -1 && self.scraped.indexOf(link) === -1) {
          // then it should be added to queue for scraping and parsing
          toCrawl.push(link);
        }
      });

      if (self.roots.indexOf(url) === -1) { // scrape url for article
        Request(url) // TODO: maybe I can avoid making another request
          .on('error', function (error) {
            self.emit('status', 'request failed will try again later');
            crawler.queue(url); // add url to the queue again
          })
          .on('response', function () {
            self.visited.push(url); // visited the url
          })
          .pipe(Extractor(url, function (err, result) {
            if (err) return self.emit('status', err);

            var article = new self.Article();
            article.title = result.title;
            article.story = HtmlToText.fromString(result.text);
            article.token = self.Article.tokenise(article.story);
            article.wordFrequency = self.Article.getWordFrequency(article.token);
            article.wordCount = article.token.length //article.story.match(/\S+/g).length; which one to use?
            article.tags = Keywords.extract(article.story, { language: 'english', return_changed_case: true });
            article.url = url;

            self.scraped.push(url);

            article.save(function (err, article) {
              if (err) return self.emit('status', err);
              else {
                self.Dictionary.documentFrequency(article);
                self.emit('article:new', article);
              }
            });
          }));
      }

      self.emit('status', 'adding to queue');
      crawler.queue(toCrawl);
    },
    onDrain: function () {
      self.emit('drained');
      // Should trigger the clustering algorithm queue is empty: true
    }
  });
  // crawler.queue('http://www.bbc.co.uk/news/technology-26272936');
  crawler.queue(this.roots); // adding roots
};

module.exports = Scraper;