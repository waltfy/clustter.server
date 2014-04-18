var DBScan = function (args) {
  if (typeof args.data === 'undefined') console.error(Error('No data provided.'));
  if (typeof args.eps === 'undefined') args.eps = 0.4;
  if (typeof args.minPoints === 'undefined') args.minPoints = 2;
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
  // initialising and timing run
  console.log('running DBScan...');
  var start = new Date().getTime();
  var c = 0;

  for (var article in this.data) {
    if (!this.isVisited(article)) { // only articles that haven't been visited
      this.visited.push(article); // mark as visited

      var neighbours = this.getNeighbours(article); // get articles neighbours

      if (neighbours.length >= this.minPoints) {
        c++;
        this.expandCluster(article, neighbours, c); // expands cluster
      }
    }
  }

  var end = new Date().getTime();
  console.log('>>>> completed in', (end - start) + 'ms.');
  callback(null, this.clusters);
};

DBScan.prototype.isVisited = function (doc) {
  return (this.visited.indexOf(doc) !== -1) ? true : false;
};

DBScan.prototype.expandCluster = function (p, neighbours, c) {
  // this.clusters[c] = [p]; // adding document p to cluster c
  for (n in neighbours) {
    if (!this.isVisited(neighbours[n])) {
      this.visited.push(neighbours[n]);
      var neighboursNew = this.getNeighbours(neighbours[n]); // what about these neighbours, should be marked as visited?
      this.visited = this.visited.concat(neighboursNew); // TODO: A BETTER SOLUTION, DISCUSS WITH STEVEN...
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
      min = (Object.keys(v1).length <= Object.keys(v2).length) ? v1 : v2; // selecting the smaller vector

  for (word in min)
    dot += (v1[word] || 0) * (v2[word] || 0); // if `v1[word]` or `v2[word]` is not present, just set it to 0.

  return dot;
};

Math.magnitude = function (v) {
  return Math.sqrt(Math.dotProduct(v, v)); // square root of the dot product of this vector
};

Math.cosineSimilarity = function (v1, v2) {
  var dotProduct = Math.dotProduct(v1, v2),
      mag1 = Math.magnitude(v1);
      mag2 = Math.magnitude(v2);
      result = dotProduct / (mag1 * mag2);

  if (isNaN(result)) return 0;
  else return result;
};

module.exports = DBScan;