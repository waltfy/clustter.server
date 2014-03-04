// instantiates the scraper
module.exports = Scraper();

// constructor
function Scraper () {
  if (!(this instanceof Scraper)) return new Scraper();

  // scraper dependencies
  var keywords = require("keyword-extractor"),
      htmlToText = require('html-to-text'),
      crawler = require('crawler').Crawler,
      extractor = require('article'),    
      request = require('request')
      events = require('events');
      async = require('async');
  
  /* private variables */
  var self = this,
      queue = [],
      roots = [],
      template = [],
      archived = [];

  /* public variables */
  this.emitter = new events.EventEmitter;
  this.models = null;

  /* private methods */
  // queries database for robots and returns and object {roots: [], templates: RegExp String};
  var getRobots = function (cb) {
    self.models.robot.find({}).select('root template').exec(function (err, robots) {
      var roots = [], template = [];
      robots.forEach(function (robot) {
        roots.push(robot.root);
        template.push(robot.template);
      });
      cb(err, {roots: roots, template: new RegExp(template.join('|'))});
    });
  };

  // queries database for articles and returns its urls only
  var getArchivedUrls = function (cb) {
    self.models.article.find({}).select('url').exec(function (err, articles) {
      var urls = articles.map(function (article) { return article.url });
      cb(err, urls);
    });
  };

  // should be called before every run, ensures latest data
  var updateData = function (cb) {
    async.parallel([
      getRobots,
      getArchivedUrls
    ], function (err, result) {
      roots = result[0].roots;
      template = result[0].template;
      archived = result[1];
      cb(err);
    });
  };

  // extracts articles and adds them to database while updating dictionary
  var parseArticles = function () {
    console.log('processing', queue.length, 'articles');

    async.each(queue, function (url, done) {
      request(url).pipe(extractor(url, function (err, result) {
        if (err) {
          console.log(new Error('Could not parse article.'));
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
            if (err) { console.log(new Error('Database failed.')); }
            else {
              self.models.dictionary.documentFrequency(article);
              console.log('new article:', article._id);
            }
            done();
          });
        }
      }));
    },
    function (err) {
      self.emitter.emit('done');
    });
  };

  // removes querystring and hash from url
  String.prototype.stripQueryAndHash = function () { return this.split('?')[0].split('#')[0]; };

  /* public methods */
  // initialises scraper
  this.init = function (models) {
    console.log('scraper... initialised');
    this.models = models;
  };

  // runs scraper
  this.run = function () {
    var c = new crawler({
      callback: function (err, result, $) {
        console.log('scraping:', this.uri);
        $('a').each(function (key, link) {
          link = link.href.stripQueryAndHash();
          if (link.match(template) && archived.indexOf(link) === -1 && queue.indexOf(link) === -1)
            queue.push(link);
        });
        console.log('>>>>', 'done.');
      },
      onDrain: function () {
        parseArticles();
      }
    });

    queue = []; // reset queue
    async.parallel([
      updateData,
      self.checkConnection
    ], function (err, result) {
      if (!err)
        c.queue(roots); // crawl roots for links
      else
        return err;
    });
  };

  // checks for internet connection returning a boolean
  this.checkConnection = function (cb) {
    require('dns').resolve('www.google.com', function (err, addresses) {
      return cb(err, !(typeof addresses === 'undefined'));
    });
  };
};