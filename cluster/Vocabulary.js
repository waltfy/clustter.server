module.exports = Vocabulary;

/** Public: Initialize a Vocabulary.
  * Returns the Vocabulary Object.
  */
function Vocabulary () {
  var v = Object.create(Vocabulary.prototype);
  v.articleList = [];
  v.dictionary = {};
  return v;
};

/** Public: adds an article to the Vocabulary.
  * article - the article to be added.
  * Returns the added article.
  */
Vocabulary.prototype.addArticle = function (article) {
  var self = this;
  this.articleList.push(article);
  for (word in article.wordFrequency) {
    if (!self.dictionary.hasOwnProperty(word))
      self.dictionary[word] = Object.keys(this.dictionary).length;
  }
  return article;
};

/** Public: estabilish where in the vector template a word is.
  * word - the target word.
  * Returns the word's index.
  */
Vocabulary.prototype.getWordPosition = function (word) {
  return this.dictionary[word];
};

/** Public: gets a blank vector template for the current size of the dictionary.
  * Returns a blank array representing the vector template.
  */
Vocabulary.prototype.getVectors =  function () {
  /* !TODO: Needs to be implemented correctly */
  var vectors = [];
  this.articleList.forEach(function (article) {
    vectors.push(article.vector);
  });
  return vectors;
};