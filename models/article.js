var Schema = require('mongoose').Schema,
    Natural = require('natural');
    Natural.PorterStemmer.attach();

module.exports = function (db) {
  return db.model('Article', ArticleSchema());
}

// Article schema
function ArticleSchema () {

  var ArticleSchema = new Schema({
    title: {type: String, required: true},
    story: { type: String, required: true },
    url: { type: String, required: true, index: {unique: true} },
    token: { type : Array , default: [] },
    wordFrequency: {},
    wordCount: { type: Number, default: 0 },
    tags: { type : Array , default: [] },
    updated: { type: Date, default: Date.now }
  });

  // Tokenises and stems the Article
  ArticleSchema.statics.tokenise = function (story) {

    return story.tokenizeAndStem();
  };

  // // Calcuates the word frequency.
  ArticleSchema.statics.getWordFrequency = function (token) {
    var wordFrequency = {};

    token.forEach(function (word) {
      if (wordFrequency.hasOwnProperty(word)) wordFrequency[word]++;
      else wordFrequency[word] = 1;
    });

    return wordFrequency;
  }

  return ArticleSchema;
}