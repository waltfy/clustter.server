module.exports = function (db) {
  return db.model('Story', StorySchema());
}

// Story schema
function StorySchema () {

  var Schema = require('mongoose').Schema;

  var StorySchema = new Schema({
    title: {type: String, required: true},
    content: {type: Array, required: true },
    refs: { type: Array, default: [] },
    // tags: { type : Array , default: [] },
    updated: { type: Date, default: Date.now }
  });

  return StorySchema;
}