var Robot = require('./Robot');

var bbc = Robot({
  rootURI: "http://www.bbc.co.uk/news/",
  uriTemplates: [new RegExp('http://www.bbc.co.uk/news/(?!#)[^-]+([^w]+-[0-9\s]*|-[0-9\s]0-9)')]
});

module.exports = bbc;