var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
var robotSchema = new Schema({
  root: { type: String, index: { unique: true } },
  template: [{ reg: String }]
});
 
module.exports = mongoose.model('Robot', robotSchema);