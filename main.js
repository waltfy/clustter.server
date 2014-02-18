/* Clustter */

// dependencies
var async = require('async'),
    Mongoose = require('mongoose'),    
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('./models/robot.js')(DB)
    Article = require('./models/article.js')(DB),
    Dictionary =  require('./models/dictionary.js')(DB);

// imports
var logging = true;
var scraper = require('./scraper/scraper')(); // scraper
// aggregator = require('aggregator'), // aggregator
// summarizer = require('summarizer'); // summarizer

function log (message) {
  if (logging) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(message);
  }
}

// initialising
console.log('Clustter\n========');
DB.on('error', console.error.bind(console, 'database connection error '));
DB.on('open', console.log.bind(console, 'database connection estabilished'));

// loading necessary items from db
async.parallel([
  function (callback) { // loading articles
    // console.log('loading articles...');
    Article.find({}, function (err, articles) {
      callback(err, articles);
    });
  },
  function (callback) { // loading robots
    // console.log('loading dictionary...');
    Robot.find({}, function (err, robots) {
      callback(err, robots);
    });
  }],
  function (err, results) {
    console.log('loaded robots & articles');
    scraper.init({ articles: results[0], robots: results[1], Article: Article, Dictionary: Dictionary }); // initialising scraper
  }
);

// events
[scraper].map(function (module) {
  module.on('log', log);
});

scraper.on('article:new', function (data) {
  log('new article', data);
});

// aggregator.on('done', function () {
//   // initialise summarizer
// });

// summarizer.on('done', functon () {
//   // initialise scraper 
// });