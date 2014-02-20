/* Clustter */

// dependencies
var async = require('async'),
    Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('./models/robot.js')(DB),
    Article = require('./models/article.js')(DB),
    Cluster = require('./models/cluster.js')(DB),
    Dictionary = require('./models/dictionary.js')(DB);

// imports
var logging = true;
var scraper = require('./scraper/scraper')(); // scraper
    var aggregator = require('./aggregator/aggregator')(); // aggregator
    // var summarizer = require('summarizer'); // summarizer

// logging function
function log (message) {
  // if (logging) {
  //   process.stdout.clearLine();
  //   process.stdout.cursorTo(0);
  //   process.stdout.write(message);
  // }
  console.log(message);
}

// initialising
console.log('Clustter\n========');
DB.on('error', console.error.bind(console, 'database connection error '));
DB.on('open', console.log.bind(console, 'database connection established'));

// loading necessary items from db
async.parallel([
  function (callback) { // loading articles
    Article.find({}, function (err, articles) {
      callback(err, articles);
    });
  },
  function (callback) { // loading robots
    Robot.find({}, function (err, robots) {
      callback(err, robots);
    });
  },
  function (callback) { // loading clusters
    Cluster.find({}, function (err, clusters) {
      callback(err, clusters);
    });
  }],
  function (err, results) {
    log('loaded robots & documents & dictionary');
    var articles = results[0],
        robots = results[1],
        clusters = results[2];
        // dictionary = results[3];

    scraper.init({ articles: articles, robots: robots, Article: Article, Dictionary: Dictionary }); // init scraper
    aggregator.init({ clusters: clusters,  Dictionary: Dictionary, Cluster: Cluster }); // init aggregator
  }
);

// events
[scraper, aggregator].map(function (module) {
  module.on('status', log);
});

scraper.on('article:new', function (article) {
  console.log('new article', article._id);
  aggregator.add(article);
});

// aggregator.on('done', function () {
//   // initialise summarizer
// });

// summarizer.on('done', functon () {
//   // initialise scraper 
// });