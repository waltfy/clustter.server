var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
var wordSchema = new Schema({
  name: { type: String, index: { unique: true } },
  pos: Number
});
 
module.exports = mongoose.model('Word', wordSchema);