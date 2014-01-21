module.exports = Article;

var natural = require('natural');
    natural.PorterStemmer.attach();

/** Public: Initialize an Article.
  * story - The string composed by the original story.
  * Returns the Article Object.
  */
function Article (story) {
  var a = Object.create(Article.prototype);
  a.story = story;
  a.token = a.story.tokenizeAndStem();
  a.uri = null;
  a.vector = [];
  a.wordFrequency = {};
  a.wordCount = a.story.toLowerCase().split(/[\s_():.!?,;"']+/).length;;
  a.calculateWordFrequency();
  return a;
};

// Public: Calculates the frequency of a word in an article as part of init.
Article.prototype.calculateWordFrequency = function () {
  wordFrequency = this.wordFrequency;
  // For each word in the array calculate its frequency.
  this.token.forEach(function (word) {
    // If the word has been found already increase the value (frequency)
    if (this.wordFrequency.hasOwnProperty(word)) {
      this.wordFrequency[word] = this.wordFrequency[word] + 1;
    } else {
      // Initialise word frequency counter.
      this.wordFrequency[word] = 1;
    }
  });
};