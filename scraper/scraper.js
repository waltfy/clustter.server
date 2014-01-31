var HtmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    Mongoose = require('mongoose'),
    Extractor = require('article'),
    Request = require('request'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('../models/robot.js')(DB)
    Article = require('../models/article.js')(DB);

console.log('Clustter Scraper\n================');

// Cleaning urls.
String.prototype.stripQueryAndHash = function () {
  return this.split("?")[0].split("#")[0];
}

DB.on('error', console.error.bind(console, 'Connection error: '));
DB.on('open', console.log.bind(console, 'Connected to DB.'));

var regexp = null;
var roots = [];
var scrapedUrls = [];

// // Loading robots and initialising crawler
Robot.find({}, function (err, robots) {
  var templates = [];

  robots.forEach(function (robot, key) {
    
    robot.template.forEach(function (regex, key) {
      templates.push(regex.reg);
    });

    crawler.queue(robot.root);
    roots.push(robot.root);
  });

  // creates a single regular expression using the or operator.
  regexp = new RegExp(templates.join('|'));
});

// Need a list from Article's urls so I don't need to scrape it again // Should store it in cache?
// Article.find({}, function (err, articles) {
//   if (err) console.log(err);
//   articles.forEach(function (article) {
//     console.log(article.wordFrequency);
//   });
// });

var crawler = new Crawler({
  callback: function (err, result, $) {

    var url = this.uri;
    var toCrawl = [];

    // For each link found in the page
    $('a').each(function (index, a) {
      var link = a.href.stripQueryAndHash();

      // if the a.href isn't a substring of any strings in array previousHrefs.indexOf(currentHref) > -1);
      if (link.match(regexp) && toCrawl.indexOf(link) === -1 && scrapedUrls.push(url)) {
        // then it should be added to queue for scraping and parsing  
        toCrawl.push(link);
      }
      
    });

    // if the current url isn't a root
    if (roots.indexOf(url) === -1) {

      // making a request again, bit annoying.
      Request(url).pipe(Extractor(url, function (err, result) {
        if (err) throw err;

        var article = new Article ();
        article.title = result.title;
        article.story = HtmlToText.fromString(result.text);
        article.url = url;
        
        article.save(function (err, article) {
          if (err) console.error(err);
        });
        // create article here?
      }));

    }

    scrapedUrls.push(url);
    crawler.queue(toCrawl);
  },
  onDrain: function () {
    console.log('queue is empty');
    // process.exit(0); // empty queue
    // Should trigger the clustering algorithm
  }
});