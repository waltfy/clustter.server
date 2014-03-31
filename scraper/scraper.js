// scraper dependencies
var htmlToText = require('html-to-text');
var keywords = require("keyword-extractor");
var extractor = require('article');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var url = require('url');

var name = 'scraper';
var self = this;

var roots = [],
    template = [],
    archived = [],
    queue = [];

// removes querystring and hash from url
String.prototype.stripQueryAndHash = function () { return this.split('?')[0].split('#')[0]; };

// queries database for robots and returns and object {roots: [], templates: RegExp String};
var getRobots = function (cb) {
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
      console.log('>>>> done');
      done();
    });
  }, cb);
};

// extracts articles and adds them to database while updating dictionary
var parseArticles = function (cb) {
  console.log('parsing', queue.length, 'articles');

  async.eachLimit(queue, 20, function (url, done) {
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
              console.log('new article:\n>>>>', article._id);
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

// public methods + properties
module.exports = {
  init: function (models) {
    self.models = models;
    console.log(name, '\n>>>> ready');
  },
  run: function (cb) {
    console.log(name, '\n>>>> started');
    async.series([
      getRobots,
      setUrls,
      checkConnection,
      scrape,
      parseArticles
    ], 
    function (err, result) {
      console.log(name, '\n>>>> done');
      cb(err, 'done');
    });
  }
};