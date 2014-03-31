// dependencies
var async = require('async'),
    Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Robot = require('./models/robot.js')(DB),
    Article = require('./models/article.js')(DB),
    Cluster = require('./models/cluster.js')(DB),
    Dictionary = require('./models/dictionary.js')(DB),
    Story = require('./models/story.js')(DB),
    argv = require('optimist').argv;

// opening database connection
DB.on('error', console.error.bind(console, 'database error.'));
DB.on('open', init);

// local variables
var modules = [
  scraper = require('./scraper/scraper'),
  aggregator = require('./aggregator/aggregator'),
  summarizer = require('./summarizer/summarizer') // summarizer
];

var models = { article: Article, dictionary: Dictionary, cluster: Cluster, robot: Robot, story: Story };

// init all modules and start scraper
function init () {
  console.log('Clustter\n========');
  console.log('database... ok');

  if (argv.cleandb || argv.c) {
    cleanDB(run); // -cleandb or c
  } else {
    run();
  }
};

// runs clustter
function run () {
  modules.forEach(function (module) {
    module.init(models);
  });
  //scraper.run();
  aggregator.run();
  // summarizer.run();
}

// clears a whole database collection
function clearCollection (model, cb) { (models[model] === Robot || models[model] === Story) ? cb(null) : models[model].remove({}).exec(cb); }; 

// cleans db for next run
function cleanDB (cb) {
  console.log('cleaning database...');
  async.each(Object.keys(models), clearCollection, function (err) {
    console.log('finsihed cleaning database.');
    if (typeof cb !== 'undefined')
      cb();
    else {
      console.log('quitting clustter...');
      process.exit(0);
    }
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
  cleanDB();
});
