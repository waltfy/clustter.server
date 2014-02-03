module.exports = function (db) {
  return db.model('Robot', RobotSchema());
}

function RobotSchema () {
  var Schema = require('mongoose').Schema;

  return new Schema({
      root: { type: String, index: { unique: true }, required: true },
      template: [{ reg: String }]
  });
}

// var bbc = new Robot();
// bbc.root = "http://www.bbc.co.uk/news/";
// bbc.template = [{ reg: 'http://www.bbc.co.uk/news/(?!#)[^-]+([^w]+-[0-9\s]*|-[0-9\s]0-9)' }];

// bbc.save(function (err, doc) {
//   console.log(doc);
// });

// var guardian = Robot();
// guardian.root =  "http://www.theguardian.com/uk";
// guardian.template = [{ reg: 'http://www.theguardian.com/(?!preference|help|edition|advertising|info|gpc|theguardian|gnm-press-office|archive|weekly|tone|video)[a-z/]+[a-z0-9]+.*' }];

// guardian.save(function (err, doc) {
//   console.log(doc);
// });