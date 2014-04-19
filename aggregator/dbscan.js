var data = {}, // data to be clustered
    eps = 0.5, // distance radius between points
    minPoints = 2; // minimum points necessary to create a cluster

var matrix = {},
    clusters = {},
    visited = []; // list of document keys that have been visited

/** Private: Interface to run the clustering process.
  * benchmark - boolean, based on environment
  returns void. */
function start (benchmark) {
  console.log('running dbscan...');
  if (benchmark) var start = new Date().getTime();
  var c = 0;
  computeDistanceMatrix();

  for (var doc in data) {
    if (!isVisited(doc)) {
      visited.push(doc); // mark as visited

      var neighbours = getNeighbours(doc);
      
      if (neighbours.length >= minPoints) {
        // console.log(doc, '\'s neighbours:');
        // console.log('>>>>', neighbours);
        // console.log('==========\n');
        c++;
        expandCluster(doc, neighbours, c);
      }
    }
  }

  var time = (benchmark) ? ('in ' + (new Date().getTime() - start) + 'ms.') : '';
  console.log('>>>> finished dbscan', time);
}

/** Private: Computes the similarity matrix for all documents
  returns void. */
function computeDistanceMatrix () {
  console.log('computing distance matrix...');
  for (var i in data) {
    matrix[i] = {};

    for (var j in data) {
      if (i === j) {
        matrix[i][j] = 1; // totally similar
      } else if (typeof matrix[j] !== 'undefined' && matrix[j].hasOwnProperty(i)) {
        matrix[i][j] = matrix[j][i];
      } else {
        matrix[i][j] = Math.cosineSimilarity(data[i].vector, data[j].vector);
      }
    }
  }
  console.log('>>>> done');
}

/** Private: Expands and creates cluster
  p - String, document cluster is based on
  neighbours - Array, neighbours of this document
  c - Number, cluster id
  returns void.
  */
function expandCluster (p, neighbours, c) {
  neighbours.forEach(function (n) {
    if (!isVisited(n)) {
      visited.push(n); // mark neighbour as visited
      var neighboursNew = getNeighbours(n);
      visited = visited.concat(neighboursNew); // TODO: A BETTER SOLUTION, DISCUSS WITH STEVEN...
      if (neighboursNew.length >= minPoints)
        neighbours = merge(neighbours, neighboursNew);
    }
  });

  clusters[c] = neighbours;
}

/** Private: Searches the matrix for neighbours within eps range
  a - String, target documents
  returns Array of neighbours of `a`.
  */
function getNeighbours (a) {
  var neighbours = [];
  
  for (var b in matrix[a])
    if (matrix[a][b] > (1 - eps) && matrix[a][b] < 1)
      neighbours.push(b);

  return neighbours;
}

/** Private: Checks whether element has been visited.
	*	e - The element to be checked.
	*	returns a boolean, true if visited, false otherwise. */
function isVisited (e) {
	return (visited.indexOf(e) !== -1) ? true : false;
}


/** Private: Merges two arrays avoiding duplication
  a - Array
  b - Array
  returns Array merged.
  */
function merge (a, b) {
  b.forEach(function (doc) {
    if (a.indexOf(doc) === -1)
      a.push(doc);
  });

  return a;
}

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

module.exports = {
	run: function (args, cb) {
    if (typeof args.data !== 'undefined') data = args.data;
    if (typeof args.eps !== 'undefined' && args.eps.constructor === Number) eps = args.eps; 
    if (typeof args.minPoints !== 'undefined' && args.minPoints.constructor === Number) args = args.minPoints;
    start((process.env.NODE_ENV !== 'production') ? true : false);
    cb(null, clusters);
	}
};