var express = require('express'),
    mongoose = require('mongoose'),
    DB = mongoose.createConnection('mongodb://localhost/clustter'),
    story = require('./models/story.js')(DB);
    app = express();

var port = 3000;

var server = app.listen(port, function () {
  console.log('api running on port', port);
});

app.get('/', function (req, res) {
  res.jsonp({ status: 'running' });
});

app.get('/stories', function (req, res) {
  story.find({}).lean().exec(function (err, stories) {
    res.jsonp(stories);
  });
});