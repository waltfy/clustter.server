var TFIDF = require('./tfidf'),
    Mongoose = require('mongoose'),
    DB = Mongoose.createConnection('mongodb://localhost/clustter'),
    Article = require('../models/article.js')(DB);

// var articleList = [];
// var dictionary = {};

function log (message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write('[Clustter]: ' + message);
  return;
}

log('loading articles');
Article.find({}, function (err, articles) {
  if (err) console.log(err);  
  else computeDictionary(articles);
});

var computeDictionary = function (articles) {
  log('computing dictionary');
  var dictionary = {};

  var start = new Date().getTime();
  articles.forEach(function (article) {
    // console.log(article.wordFrequency);
    var test = article.story;
    for (word in article.wordFrequency) {
      if (!dictionary.hasOwnProperty(word))
        dictionary[word] = Object.keys(dictionary).length;
    }
  });
  var end = new Date().getTime();

  log('completed in ' + (end - start) + 'ms');

  // console.log(dictionary);

  // computeTFIDF(articles, dictionary);
};

var computeTFIDF = function (articles, dictionary) {
  log('computing TFIDF');

  articles.forEach(function (article) {
    
    article.vector = new Array(Object.keys(dictionary).length + 1).join('0').split('').map(parseFloat);

    for (word in article.wordFrequency) {
      if(dictionary[word] === undefined)
        console.log(word);
      article.vector[dictionary[word]] = TFIDF.run(word, article, articles);
    }

    console.log(article.vector);
  });

};

/* Running TFIDF on list of articles and setting vectors */


// vocabulary.articleList.forEach(function (article) {
//   // For every word process the tf-idf
//   article.vector = new Array(Object.keys(vocabulary.dictionary).length + 1).join('0').split('').map(parseFloat);
//   for (word in article.wordFrequency) {
//     if(vocabulary.getWordPosition(word) == undefined)
//       console.log(word);
//     article.vector[vocabulary.getWordPosition(word)] = TFIDF.run(word, article, vocabulary.articleList);
//   }
// });

// var start = new Date().getTime();
// var end = new Date().getTime();

// console.log('Process Completed in ' + (end - start) + 'ms');