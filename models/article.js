module.exports = function (db) {
  return db.model('Article', ArticleSchema());
}

function ArticleSchema () {

  var Schema = require('mongoose').Schema;
  var Natural = require('natural');
      Natural.PorterStemmer.attach();


  ArticleSchema = new Schema({
    title: {type: String, required: true},
    story: { type: String, required: true },
    url: { type: String, required: true, index: {unique: true} },
    updated: { type: Date, default: Date.now }
  });

  // Counts how many words there are in the article
  ArticleSchema.virtual('wordCount')
    .get(function () {
      return this.story.match(/\S+/g).length;
    });

  // Tokenises and stems the article
  ArticleSchema.virtual('token')
    .get(function () {
      return this.story.tokenizeAndStem();
    });

  // Calcuates the word frequency.
  ArticleSchema.virtual('wordFrequency')
    .get(function () {
      var wordFrequency = {};
      
      this.token.forEach(function (word) {
        if (wordFrequency.hasOwnProperty(word))
          wordFrequency[word]++;
        else 
          wordFrequency[word] = 1;
      });

      return wordFrequency;
    });

  return ArticleSchema;
}