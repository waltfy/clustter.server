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

var models = { article: Article, dictionary: Dictionary, cluster: Cluster, robot: Robot };

// init all modules and start scraper
function init () {
  console.log('Clustter\n========');
  console.log('database... ok');
  modules.forEach(function (module) {
    module.init(models);
  });
  // scraper.run();
  aggregator.run();
};

function clearCollection (model, cb) {
  (models[model] === Robot) ? cb(null) : models[model].remove({}).exec(cb);
};

function cleanDB () {
  async.each(Object.keys(models), clearCollection, function (err) {
    console.log('finsihed cleaning database');
    console.log('quitting program');
    process.exit(0);
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

// summarizer.emitter.on('done', function () {
//   console.log('summarizer has finished');
//   cleanDB();
// });