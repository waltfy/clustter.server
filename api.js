var cluster = require('cluster');

// forking from master
if (cluster.isMaster) {
  // counting cpus
  var cpuCount = require('os').cpus().length;

  // worker for each cpu
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

} else {

  var express = require('express'),
      mongoose = require('mongoose'),
      DB = mongoose.createConnection('mongodb://localhost/clustter'),
      story = require('./models/story.js')(DB);
      api = express();

  var port = 3000;

  var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
  };

  api.use(allowCrossDomain);

  // opening database connection
  DB.on('error', console.error.bind(console, 'database error.'));
  DB.on('open', init);

  var cachedStories = {};

  function init () {
    getFeed();
    // setInterval(getFeed, 43200000);
  };

  var getFeed = function () {
    var time = getQueryTime();
    story.find({ updated: { $lt: time.lt, $gt: time.gt } }).lean().exec(function (err, stories) {
      cachedStories = stories;
    });
  };

  var getQueryTime = function () {
    var now = new Date(),
        hour = now.getHours();

    return (hour > 12) ? {gt: new Date().setHours(12), lt: new Date().setHours(24) } : { gt: new Date().setHours(00), lt: new Date().setHours(12) };
  };

  var server = api.listen(port, function () {
    console.log(cluster.worker.id, 'api running on port', port);
  });

  api.get('/', function (req, res) {
    res.jsonp({ status: 'running' });
  });

  api.get('/stories', function (req, res) {
    res.jsonp({stories: cachedStories});
  });

}