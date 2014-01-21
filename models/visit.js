var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
var visitSchema = new Schema({
  url: { type: String, index: { unique: true } },
  date: { type: Date, default: Date.now }
});
 
module.exports = mongoose.model('Visit', visitSchema);