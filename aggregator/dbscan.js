var DBScan = function (args) {
  if (typeof args.data === 'undefined') console.error(Error('No data provided.'));
  if (typeof args.eps === 'undefined') args.eps = 0.5;
  if (typeof args.minPoints === 'undefined') args.minPoints = 1;
  if (Object.keys(args.data).length === 0) console.error(Error('No articles found'));

  obj = Object.create(DBScan.prototype);

  obj.data = args.data;
  obj.eps = args.eps;
  obj.minPoints = args.minPoints;
  obj.visited = [];
  obj.clusters = {};

  return obj;
};

DBScan.prototype.run = function (callback) {
  // initialising and benchmarking
  console.log('Running DBScan...');
  var start = new Date().getTime();

  var self = this;

  var c = 0;

  for (var article in this.data) {

    if (!this.isVisited(article)) { // if article hasn't been visited

      this.visited.push(article); // mark as visited

      var neighbours = this.getNeighbours(article); // get article's neighbours

      if (neighbours.length === 0) { // article has no neighbours
        c++;
        this.clusters[c] = [article]; // initialises cluster with a single article
      } else {
        c++;
        this.expandCluster(article, neighbours, c); // expands cluster
      }
    }
  }

  var end = new Date().getTime();
  console.log('done in ' + (end - start) + 'ms.');
  callback(null, this.clusters);
};

DBScan.prototype.isVisited = function (doc) {
  return (this.visited.indexOf(doc) === -1) ? false : true;
};

DBScan.prototype.expandCluster = function (doc, neighbours, c) {
  this.clusters[c] = [doc]; // adding doc to cluster

  for (n in neighbours) {
    if (!this.isVisited(neighbours[n])) {
      this.visited.push(neighbours[n]);
      var neighboursNew = this.getNeighbours(neighbours[n]); // what about these neighbours, they should be marked as visited.
      if (neighboursNew.length >= this.minPoints)
        neighbours = this.merge(neighbours, neighboursNew);
    }
  }

  this.clusters[c] = neighbours;
};

DBScan.prototype.getNeighbours = function (a) {
  var self = this;
  var neighbours = [];

  for (var b in this.data) {
    if (a === b) continue;
    if (Math.cosineSimilarity(this.data[a].vector, this.data[b].vector) > (1 - self.eps))
      neighbours.push(b);
  }

  return neighbours;
};

DBScan.prototype.merge = function (a, b) {

  b.forEach(function (doc) {
    if (a.indexOf(doc) === -1)
      a.push(doc);
  });

  return a;
};

Math.dotProduct = function (v1, v2) {
  var dot = 0,
      min = (Object.keys(v1).length <= Object.keys(v2).length) ? v1 : v2;

  for (word in min)
    dot += (v1[word] || 0) * (v2[word] || 0);

  return dot;
};

Math.magnitude = function (v) {

  return Math.sqrt(Math.dotProduct(v, v));
};

Math.cosineSimilarity = function (v1, v2) {
  var dotProduct = Math.dotProduct(v1, v2),
      mag1 = Math.magnitude(v1);
      mag2 = Math.magnitude(v2);
      result = dotProduct / (mag1 * mag2);

  if (isNaN(result)) {
    return 0;
  } else {
   return result;
  }
};

module.exports = DBScan;