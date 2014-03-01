// dependencies
var async = require('async'),
    Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('./models/robot.js')(DB),
    Article = require('./models/article.js')(DB),
    Cluster = require('./models/cluster.js')(DB),
    Dictionary = require('./models/dictionary.js')(DB);

// opening database connection
DB.on('error', console.error.bind(console, 'database error.'));
DB.on('open', init);

// local variables
var modules = [
  scraper = require('./scraper/scraper'),
  aggregator = require('./aggregator/aggregator'),
  summarizer = require('./summarizer/summarizer') // summarizer
];

var models = {article: Article, dictionary: Dictionary, cluster: Cluster, robot: Robot };

// initialises clustter
function init () {
  console.log('Clustter\n========');
  modules.forEach(function (module) {
    module.init(models);
  });
};

/* event listeners */
scraper.emitter.on('done', function () {
  console.log('scraper has finished');
  aggregator.run();
});

aggregator.emitter.on('done', function () {
  console.log('aggregator has finished');
  summarizer.run();
});

summarizer.emitter.on('done', function () {
  console.log('summarizer has finished');
  setTimeout(function () {
    scraper.run();
  }, 5000);
});