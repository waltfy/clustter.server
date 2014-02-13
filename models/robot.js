module.exports = function (db) {
  return db.model('Robot', RobotSchema());
}

// robot schema
function RobotSchema () {
  var Schema = require('mongoose').Schema;

  return new Schema({
    root: { type: String, index: { unique: true }, required: true },
    template: { type: String, required: true }
  });
}

// var bbc = new Robot();
// bbc.root = "http://www.bbc.co.uk/news/";
// bbc.template = 'http://www.bbc.co.uk/news/(?!#)[^-]+([^w]+-[0-9\s]*|-[0-9\s]0-9)'

// bbc.save(function (err, doc) {
//   console.log(doc);
// });

// var guardian = new Robot();
// guardian.root =  "http://www.theguardian.com/uk";
// guardian.template = 'http://www.theguardian.com/[a-z-]+/[0-9]+/[a-z]+/[0-9]+/.*'

// guardian.save(function (err, doc) {
//   console.log(doc);
// });

// var yahoo = new Robot();
// yahoo.root = 'http://uk.news.yahoo.com/';
// yahoo.template = 'http://uk.news.yahoo.com/(?!video)[a-z.]+.+.html'

// yahoo.save(function (err, doc) {
//   console.log(doc);
// });