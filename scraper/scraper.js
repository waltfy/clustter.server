var HtmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    Mongoose = require('mongoose'),
    Extractor = require('article'),
    Keywords = require("keyword-extractor"),
    Request = require('request'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('../models/robot.js')(DB)
    Article = require('../models/article.js')(DB),
    Dictionary =  require('../models/dictionary.js')(DB);

console.log('Clustter Scraper\n================');

require('dns').resolve('www.google.com', function(err) {
  if (err) {
    log('no internet connection');
    process.exit(0);
  }
});

// TODO: move this out.
// cleans url query strings and same page anchors
String.prototype.stripQueryAndHash = function () {
  return this.split('?')[0].split('#')[0];
}

function log (message) {
  if (log_mode) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(roots.length + ' robots, ' + scraped.length + ' articles, ' + visited.length + ' visited urls, ' + 'status: ' + message);
  }
  return;
}

DB.on('error', console.error.bind(console, 'database connection error '));
DB.on('open', function() { log('connected to database') });

// locals
var log_mode = true;
var threshold = 200;
var regexp = null;
var roots = [];
var scraped = [], visited = [];
var articles = [];

log('loading robots');
Robot.find({}, function (err, robots) {
  var templates = [];

  robots.forEach(function (robot, key) {    
    templates.push(robot.template);
    roots.push(robot.root);
    crawler.queue(robot.root);
  });

  // creates a single regular expression using the or operator.
  regexp = new RegExp(templates.join('|'));
});

log('loading articles');
Article.find({}, function (err, articles) {
  if (err) console.log(err);
  articles.forEach(function (article) {
    scraped.push(article.url);
  });
});

var crawler = new Crawler({
  callback: function (err, result, $) {
    var url = this.uri;
    var toCrawl = [];

    log('scraping links')
    $('a').each(function (index, a) {
      var link = a.href.stripQueryAndHash();
      // if it matches the link structure and is not already on the queue and it hasn't been visited yet
      if (link.match(regexp) && toCrawl.indexOf(link) === -1 && visited.indexOf(link) === -1 && scraped.indexOf(link) === -1) {
        // then it should be added to queue for scraping and parsing
        toCrawl.push(link);
      }
    });

    // if the current url isn't a root
    if (roots.indexOf(url) === -1) {

      // TODO: avoid making another request.
      Request(url)
        .on('error', function (error) {
          log(error);
          crawler.queue(url);
        })
        .on('response', function (response) {
          visited.push(url);
        })
        .pipe(
          Extractor(url, function (err, result) {
            log('scraping article');

            var article = new Article();
            article.title = result.title;
            article.story = HtmlToText.fromString(result.text);
            article.token = Article.tokenise(article.story);
            article.wordFrequency = Article.getWordFrequency(article.token);
            article.wordCount = article.token.length //article.story.match(/\S+/g).length; which one to use?
            article.tags = Keywords.extract(article.story, { language: 'english', return_changed_case: true });
            article.url = url;
            
            article.save(function (err, article) {
              if (err) console.log(err);
              else {
                scraped.push(article.url);
                log('scraped')
                Dictionary.documentFrequency(article);
              }
            });
          })
        ); 
    }

    log("adding to queue");
    crawler.queue(toCrawl);
  },
  onDrain: function () {
    log('queue is empty');
    // Should trigger the clustering algorithm queue is empty: true
  }
});