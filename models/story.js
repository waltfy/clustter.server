var Schema = require('mongoose').Schema;

module.exports = function (db) {
  return db.model('Story', StorySchema());
}

// Story schema
function StorySchema () {

  var StorySchema = new Schema({
    title: { type: String, required: true },
    content: {type: Array, required: true },
    refs: { type: Array, default: [] },
    category: { type: String, required: true },
    updated: { type: Date, default: Date.now }
  });

  return StorySchema;
}