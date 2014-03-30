var Schema = require('mongoose').Schema;

module.exports = function (db) {
  return db.model('Cluster', ClusterSchema());
}

function ClusterSchema () {

  var ClusterSchema = new Schema({
    articles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    updated: { type: Date, default: Date.now }
  });

  return ClusterSchema;
}