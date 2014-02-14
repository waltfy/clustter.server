var get = require('mongoose').Types; // get.ObjectId(); Used to retrieve a new cluster id.

Math.dotProduct = function (v1, v2) {
  var dot = 0, min = Math.min(Object.keys(v1).length, Object.keys(v2).length);

  for (word in v1) {
    var value = v2[word] || 0;
    dot += v1[word] * value;
  }

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

var DBScan = function (args) {
  if (typeof args.data === 'undefined') { callback('No data provided.', null); return; }
  if (typeof args.eps === 'undefined') args.eps = 0.5;
  if (typeof args.minPoints === 'undefined') args.minPoints = 1;

  obj = Object.create(DBScan.prototype);
  obj.data = args.data;
  obj.eps = args.eps;
  obj.minPoints = args.minPoints;
  obj.visitedList = [];
  obj.resultList = {};

  return obj;
};

DBScan.prototype.run = function (callback) {
  // initialising and benchmarking
  console.log('Running DBScan...');
  var start = new Date().getTime();

  // local variables
  var self = this;

  // for each document in the data set
  for (var doc in this.data) {
    
    if (this.visitedList.indexOf(doc) === -1) {
      this.visitedList.push(doc); // visiting

      var neighbours = this.getNeighbours(doc); // get its neighbours

      if (neighbours.length >= this.minPoints) {

        neighbours.forEach(function (neighbour) {

          if (self.visitedList.indexOf(neighbour) === -1) {
            self.visitedList.push(neighbour);

            var neighbours_new = self.getNeighbours(neighbour);

            if (neighbours_new.length >= self.minPoints) {
              // console.log('concatenating')
              // console.log('n1', neighbours);
              // console.log('with');
              // console.log('n2', neighbours_new);
              neighbours = self.merge(neighbours, neighbours_new);
              // console.log('result', neighbours);
              // console.log('=========');
            } 
            
          }
        });
        
        this.resultList[get.ObjectId()] = neighbours;
      }
    }
  }
  var end = new Date().getTime();
  console.log('done in ' + (end - start) + 'ms.');
  callback(null, this.resultList);
};

DBScan.prototype.getNeighbours = function (a) {
  var self = this;
  var neighbours = [];
  
  for (var b in this.data)
    if (a !== b && Math.cosineSimilarity(this.data[a].vector, this.data[b].vector) > (1 - self.eps))
      neighbours.push(b);

  return neighbours;
};

DBScan.prototype.merge = function (a, b) {

  b.forEach(function (doc) {
    if (a.indexOf(doc) === -1)
      a.push(doc);
  });

  return a;
};

module.exports = DBScan;