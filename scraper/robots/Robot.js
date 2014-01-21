module.exports = Robot;

/** Public: initializes a Robot.
  * rootURI - self descriptive.
  * urlTemplates - an array of regular expressions.
  * Returns an instance of a Robot object.
  */
function Robot (obj) {
  var r = Object.create(Robot.prototype);
  r.rootURI = obj.rootURI;
  r.uriTemplates = obj.uriTemplates;
  return r;
};