var Parameters = function (words, visited, robots) {
  p = Object.create(Parameters.prototype);
  p.duplicates = 0;
  p.words = words;
  p.robots = robots;
  p.visited = visited;
  p.status = 'idle';
  return p;
}

Parameters.prototype.print = function () {
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  process.stdout.write("words: " + this.words.length + " visited: " + this.visited + " skipped: " + this.duplicates + " Status: " + this.status);
}

module.exports = Parameters;