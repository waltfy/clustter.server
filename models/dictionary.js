module.exports = function (db) {
  return db.model('Dictionary', DictionarySchema());
}

function DictionarySchema () {
  var Schema = require('mongoose').Schema;

  var DictionarySchema = new Schema({
    word: { type: String, index: {unique: true}, required: true },
    documentFrequency: { type: Number, required: true, default: 0 }
  }, { collection: 'dictionary'});

  // Maintains the document frequency of a term given an article.
  DictionarySchema.statics.documentFrequency = function (doc) {
    for (var word in doc.wordFrequency)
      this.update({word: word}, { $inc: { documentFrequency: 1 }}, {upsert: true}).exec();

    return;
  };

  return DictionarySchema;
}