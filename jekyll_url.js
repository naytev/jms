const child_process = require('child_process');
const spawn = child_process.spawn;

function get(jekyllSite, path) {
  console.log("Jekyll get site", path)
  var child = spawn('bundle', ['exec', 'jekyll', 'url', path], {
    cwd: jekyllSite.path
  });
  var promise = new Promise((resolve, reject) => {
    var output = []
    child.stdout.on('data', (data) => {
      output.push(data.toString('utf8'));
    });
    child.on('close', () => {
      console.log(output)
      console.log("Jekyll get site " + output[output.length -1]);
      resolve(output[output.length -1]);
    });
  })
  return promise;
}

module.exports = {
  get
}