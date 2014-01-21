var readability = require('readability-api'),
    htmlToText = require('html-to-text'),
    Crawler = require('crawler').Crawler,
    mongoose = require('mongoose'),
    async = require('async'),
    db = mongoose.connection,    
    /* Models */
    // Article = require('../tfidf/Article.js'),
    Parameters = require('./Parameters'),
    Robot = require('../models/robot.js'),
    Visit = require('../models/visit.js'),
    Word = require('../models/word.js');

console.log('==== Clustter ====');
mongoose.connect('mongodb://localhost/clustter');

readability.configure({
  consumer_key: 'waltercarvalho',
  consumer_secret: 'ygwaQBvUsJkq7GCYfybDxzbAMKfTdnEN',
  parser_token: '4403e0e378f3ded399e20839ede5cc09b71e350f'
});

// Create a parser object
var parser = new readability.parser();

// Get the Parser confidence level 
parser.confidence('http://www.bbc.co.uk/news/technology-25316228', function (err, confidence) {
  if (confidence >= 0.5) {
    // Parse an article
    parser.parse('http://www.bbc.co.uk/news/technology-25316228', function (err, parsed) {
      var text = htmlToText.fromString(parsed.content);
      console.log(text);
    });
  }
});

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {
  console.log('database connected @ ' + db.host + ':' + db.port);
  /* pull words and visited URLs from db */
  async.parallel([
    function(callback) {
      Word.find({}).exec(callback);
    },
    function(callback) {
      Visit.count({}).exec(callback);
    },
    function(callback) {
      Robot.find({}).exec(callback);
    }], function(err, result) {
      if (err) throw err;
      /* initialise scraper */
      init(result[0], result[1], result[2]);
    });
});

/* initialises parameters */
var init = function (words, visitedCount, robots) {
  var p = Parameters(words, visitedCount, robots);
  run(p);
}

/* run time */
var run = function (p) {
  /* crawler */
  var c = new Crawler({
    callback: function (err, result, $) {
      /* uri should not be root and it should match at least one template */
      if (this.robot.root !== this.uri && matchesAnyTemplate(this.robot.template, this.uri)) {
        p.status = 'scraping';
      } else {
        p.status = 'root';
      }
    },
    onDrain: function () {
      p.status = 'empty queue';
      process.exit(0);
    }
  });

  /* loading robots */
  p.robots.forEach(function (robot) {
    /* add uri and robot to crawler's queue */
    c.queue({
      'uri': robot.root,
      'robot': robot
    });
  });

  // p.print();
  setInterval(function() {
    p.print();
  }, 1);
}

var printStats = function (p) {
  process.stdout.write('')
}

var matchesAnyTemplate = function (template, url) {
  var result = false;
  template.forEach(function (re) {
    var pattern = new RegExp(re.reg);
    if (pattern.test(url)) { return result = true; }
  });
  return result;
}