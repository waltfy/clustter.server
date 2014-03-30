// scraper dependencies
var htmlToText = require('html-to-text');
var keywords = require("keyword-extractor");
var extractor = require('article');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var url = require('url');

var moduleName = 'scraper';

var roots = [],
    template = [],
    archived = [],
    queue = [];

var self = this;

// removes querystring and hash from url
String.prototype.stripQueryAndHash = function () { return this.split('?')[0].split('#')[0]; };

// queries database for robots and returns and object {roots: [], templates: RegExp String};
var setRobots = function (cb) {
  self.models.robot.find({}).lean().exec(function (err, robots) {
    robots.forEach(function (r) {
      roots.push(r.root);
      template.push(r.template);
    });
    template = new RegExp(template.join('|'))
    cb(null, 'loaded robots');
  });
};

// queries database for articles and returns its urls only
var setUrls = function (cb) {
  self.models.article.find({}).select('url').exec(function (err, articles) {
    self.archived = articles.map(function (article) { return article.url });
    cb(err, 'loaded urls');
  });
};

// checks for internet connection returning a boolean
var checkConnection = function (cb) {
  require('dns').resolve('www.google.com', function (err, addresses) {
    return cb(err, !(typeof addresses === 'undefined'));
  });
};

// scrapes for articles that match our template
var scrape = function (cb) {
  async.each(roots, function (root, done) {
    request({uri: root}, function (err, res, body) {
      var $ = cheerio.load(body);
      var uri = res.request.uri;
      console.log(uri.hostname);
      console.log('scraping:', root);
      
      $('a').each(function (key, link) {
        try {
          link = url.resolve(root, $(this).attr('href')).stripQueryAndHash();  
        } catch (e) {
          link = root;
        }

        if (link.match(template) && archived.indexOf(link) === -1 && queue.indexOf(link) === -1)
          queue.push(link);
      });
      console.log(queue.length);
      done();
    });
  }, cb);
};

// extracts articles and adds them to database while updating dictionary
var parseArticles = function (cb) {
  console.log('processing', queue.length, 'articles');

  async.eachLimit(queue, 10, function (url, done) {
    request(url)
      .on('error', function (err) {
        console.error(err);
        done();
      })
      .pipe(extractor(url, function (err, result) {
        if (err) {
          console.error(new Error('Could not parse article.'));
          done();
        } else {
          var articleModel = self.models.article;
          var article = new articleModel;

          article.title = result.title;
          article.story = htmlToText.fromString(result.text);
          article.token = articleModel.tokenise(article.story);
          article.wordFrequency = articleModel.getWordFrequency(article.token);
          article.wordCount = article.token.length //article.story.match(/\S+/g).length; which one to use?
          article.tags = keywords.extract(article.story, { language: 'english', return_changed_case: true });
          article.url = url;

          article.save(function (err, article) {
            if (err) { console.log(new Error('Could not save article.')); }
            else {
              console.log('new article:', article._id);
              done();
            }
          });
        }
      })
    );
  },
  function (err) {
    cb(err, 'done');
  });
};

// public methods
module.exports = {
  log: function (m) {console.log.bind(console, m)},
  init: function (models) {
    self.models = models;
  }.bind(this),
  run: function (cb) {
    console.log(moduleName, 'running');
    async.series([
      setRobots,
      setUrls,
      checkConnection,
      scrape,
      parseArticles
    ], 
    function (err, result) {
      console.log(err);
      console.log(moduleName, 'finished');
      cb(err, 'done');
    });
  }
};