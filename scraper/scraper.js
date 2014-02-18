// scraper class dependencies
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Scraper = function () {
  if (!(this instanceof Scraper)) return new Scraper(); // unsure about this?
  EventEmitter.call(this); // Calling EventEmitter constructor.

  this.template = new Array();
  this.roots = new Array();
  this.visited = new Array();
  this.scraped = new Array();
}

util.inherits(Scraper, EventEmitter);

// scraper dependencies
var HtmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    Extractor = require('article'),
    Keywords = require("keyword-extractor"),
    Request = require('request');

String.prototype.stripQueryAndHash = function () {
  return this.split('?')[0].split('#')[0];
}

Scraper.prototype.checkConnection = function () {
  var connection = true;
  var self = this;
  require('dns').resolve('www.google.com', function(err) {
    if (err) {
      self.emit('log', 'no internet connection');
      connection = false;
      // process.exit(0);
    }
  });
  console.log('connected:', connection);
  return connection;
};

Scraper.prototype.init = function (args) {
  var self = this;

  args.robots.forEach(function (robot) { // load configs from robots
    self.template.push(robot.template);
    self.roots.push(robot.root);
  });

  this.template = new RegExp(this.template.join('|')); // creates a single regular expression using the or operator.

  args.articles.forEach(function (article) { // load configs from articles
    self.scraped.push(article.url);
  });

  if (this.checkConnection()) // if we have internet connection we can run
    this.run();
};

Scraper.prototype.run = function () {
  
  var self = this;
  var crawler = new Crawler({
    callback: function (err, result, $) {
      var url = this.uri;
      var toCrawl = [];

      self.emit('log', 'scraping links');
      $('a').each(function (index, a) {
        var link = a.href.stripQueryAndHash();
        // if it matches the link structure and is not already on the queue and it hasn't been visited yet
        if (link.match(self.template) && toCrawl.indexOf(link) === -1 && self.visited.indexOf(link) === -1 && self.scraped.indexOf(link) === -1) {
          // then it should be added to queue for scraping and parsing
          toCrawl.push(link);
        }
      });

      // if the current url isn't a root
      if (self.roots.indexOf(url) === -1) {


        // TODO: avoid making another request.
        Request(url)
          .on('error', function (error) {
            // log(error);
            crawler.queue(url);
          })
          .on('response', function (response) {
            self.emit('log', 'scraping article');
            self.visited.push(url);
          })
          .pipe(
            Extractor(url, function (err, result) {

              var article = {};
              article.text = HtmlToText.fromString(result.text);
              article.tags = Keywords.extract(result.text, { language: 'english', return_changed_case: true });
              article.url = url;

              self.emit('article:new', article);

              // var article = new Article();
              // article.title = result.title;
              // article.story = HtmlToText.fromString(result.text);
              // article.token = Article.tokenise(article.story);
              // article.wordFrequency = Article.getWordFrequency(article.token);
              // article.wordCount = article.token.length //article.story.match(/\S+/g).length; which one to use?
              // article.tags = Keywords.extract(article.story, { language: 'english', return_changed_case: true });
              // article.url = url;
              
              // article.save(function (err, article) {
              //   if (err) console.log(err);
              //   else {
              //     self.scraped.push(article.url);
              //     console.log('scraped');
              //     // Dictionary.documentFrequency(article);
              //   }
              // });
            })
          ); 
      }

      self.emit('log', 'adding to queue');
      crawler.queue(toCrawl);
    },
    onDrain: function () {
      self.emit('drained');
      // Should trigger the clustering algorithm queue is empty: true
    }
  });
  
  crawler.queue(this.roots); // adding roots
};

module.exports = Scraper;