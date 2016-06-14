const child_process = require('child_process');
const spawn = child_process.spawn;
const exec = child_process.exec;
const fs = require('fs-extra-promise');

var jekyllProcesses = new Map();
var portCounter = []; // Simple ticket reservation system to ensure that multiple jekylls don't run on the same port
for (var i = 0; i < 100; i++) {
  portCounter.push(4000 + i);
}

function makeSite(username, path) {
  return {
    id: username,
    path
  }
}

function startServer(jekyllSite) {
  var port = portCounter.pop();
  var promise = new Promise(function(resolve, reject) {
    exec('bundle install', {
      cwd: jekyllSite.path
    }, function(err) {
      fs.removeSync(jekyllSite.path + "/_site");
      var params = ['exec', 'jekyll', 'server', '--port' , port, '--config', '_config.yml,_config_jms.yml', '--drafts', '--future'];
      console.log('Starting the bundle command', params);
      var child = spawn('bundle', params, {
        cwd: jekyllSite.path,
        env: Object.assign({}, process.env, {
          'JEKYLL_ENV': 'production'
        })
      });
      child.stdout.on('data', (data) => {
        console.log('JekyllServer: ' + data.toString('utf8'));
      });
      child.on('error', (e) => {
        console.log('JekyllServer Error', e);
      })
      child.on('close', () => {
        portCounter.push(jekyllSite.port);
        jekyllProcesses.delete(jekyllSite.id);
      });

      jekyllSite.port = port;
      jekyllProcesses.set(jekyllSite.id, child);
      resolve(jekyllSite);
    })
  })
  return promise;
}

function closeServer(jekyllSite) {
  var child = jekyllProcesses.get(jekyllSite.id);
  child.kill();
}

function ensure(jekyllSite){
  if(jekyllProcesses.has(jekyllSite.id)){
    return Promise.resolve(jekyllSite);
  } else {
    return startServer(jekyllSite);
  }

}

module.exports = {
  ensure,
  makeSite,
  startServer,
  closeServer
}