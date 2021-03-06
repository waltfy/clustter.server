var conf = require('./conf.json');
process.title = conf.name; // sets the process title
process.env.NODE_ENV = conf.env; // sets the environment

// main dependencies
var async = require('async');
var mongoose = require('mongoose');
var DB = mongoose.createConnection('mongodb://localhost/clustter'); // opening database connection
var argv = require('optimist').argv;

// database event listeners
DB.on('error', console.error.bind(console, new Error('database error.'))); // error
DB.on('open', init); // initialises clustter

// own module dependencies
var modules = {
  scraper: require('./scraper/scraper'),
  aggregator: require('./aggregator/aggregator'),
  summarizer: require('./summarizer/summarizer')
};

// models
var models = {
  robots: require('./robots.json'), // static file
  article: require('./models/article.js')(DB),
  cluster: require('./models/cluster.js')(DB),
  story: require('./models/story.js')(DB)
};

// initialise clustter
function init () {
  console.log(process.title, new Date(), '\n========');
  initModules();
  if (argv.cleandb || argv.c)
    cleanDB(run); // -cleandb or c
  else
    run();
};

// initialises all of clustter's modules
function initModules () {
  Object.keys(modules).forEach(function (k) {
    modules[k].init(models);
  });
};

// runs tasks as async.series, scrape->aggregate->summarize
function run () {
  async.series([
    modules.scraper.run,
    modules.aggregator.run,
    modules.summarizer.run
  ],
  function (err, result) {
    console.log('clustter complete');
    cleanDB();
  });
};

// clears a given database collection
function clearCollection (model, cb) {
  (model === 'robots' || model === 'story') ? cb(null) : models[model].remove({}).exec(cb);
}; 

// cleans db for next run
function cleanDB (cb) {
  console.log('cleaning database...');
  async.each(Object.keys(models), clearCollection, function (err) {
    console.log('>>>> done.');
    if (typeof cb !== 'undefined')
      cb();
    else {
      console.log('quitting clustter...');
      process.exit(0);
    }
  });
};