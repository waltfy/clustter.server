var TFIDF = {};
module.exports = TFIDF;

/** Public: initialize an Article.
  * word - the word to be analysed.
  * article - article in which the word occurs.
  * articlesList - all of the documents in the vocabulary.
  * Returns the tfidf score for the given word.
  */
TFIDF.run = function (word, article, articlesList) {
  return (TFIDF.tf(word, article) * TFIDF.idf(word, articlesList));
};

/** Public: calculates the term-frequency of a word in an article.
  * word - The target word.
  * article - The article to be scanned.
  * Returns the tf as an float.
  */
TFIDF.tf = function (word, article) { 
  return (article.wordFrequency[word] / article.wordCount);
};

/** Public: calculates the inverse document frequency.
  * word - target word.
  * articleList - all of the documents in the vocabulary.
  * Returns the idf as an float.
  */
TFIDF.idf = function (word, articlesList) { 
  return Math.log(articlesList.length / TFIDF.numArticlesContaining(word, articlesList));
};

/** Public: calculates the number of documents that contain a word.
  * word - target word.
  * articleList - all of the documents in the vocabulary.
  * Returns count of documents.
  */
TFIDF.numArticlesContaining = function (word, articlesList) {
  // Count of articles containing the word.
  var count = 0;
  // Iterate through articles.
  for (var i = 0; i < articlesList.length; i++) {
    var article = articlesList[i];
    // If the word is present in this articleu increase the count.
    if (article.wordFrequency[word] > 0) count++;
  }
  return count;
};

/** Public: determines cosine similarity between 2 vectors.
  * vector1 - vector representation of a document.
  * vector2 - vector representation of a document.
  * Returns a float, which determines how similar 2 documents are.
  */
TFIDF.findCosineSimilarity = function (vector1, vector2) {
  var dotProduct = TFIDF.dot(vector1, vector2),
      magnitudeOfA = TFIDF.magnitude(vector1);
      magnitudeOfB = TFIDF.magnitude(vector2);
      result = dotProduct / (magnitudeOfA * magnitudeOfB);

  if (isNaN(result)) {
    return 0;
  } else {
   return result;
  }
};

/** Public: calculates the dot product between two vectors. 
  * vector1 - vector represenation of a document.
  * vector2 - vector represenation of a document.
  * Returns an int representing the dot product of two vectors.
  */
TFIDF.dot = function (vector1, vector2) {
  var dot = 0, min = Math.min(vector1.length, vector2.length);

  for (var i = 0; i < min; i++)
    dot += vector1[i] * vector2[i];
  return dot;
};

/** Public: Calculates the magnitude of a vector.
  * -> special thanks to Tom Ashworth (http://www.twitter.com/phuunet)
  * vector - vector representation of a document.
  * Returns the magnitude of given vector as a float.
*/
TFIDF.magnitude = function (vector) {
  var magnitude = Math.sqrt(TFIDF.dot(vector, vector));
  return magnitude;
};