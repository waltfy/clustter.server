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
  DictionarySchema.statics.documentFrequency = function (article) {    
    
    var update = { $inc: { documentFrequency: 1 }};

    for (var word in article.wordFrequency) {
      this.update({word: word}, update, {upsert: true}).exec();
    }

  };

  return DictionarySchema;
}