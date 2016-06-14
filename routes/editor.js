var express = require('express');
var router = express.Router();
var glob = require('glob-promise');
var fs = require('fs-extra-promise');
var path = require('path');

const ignoreFiles = ['_site', '.git', '.gitignore', '_config.yml', '_config_prod.yml', '_plugins', 's3_website.yml', 'CNAME', 'Gemfile', 'Gemfile.lock', 'LICENSE', 'README.md', 'Rakefile'];

function dirTree(jekyllSite, filename, ignore = [], selected = "") {
  var stats = fs.lstatSync(filename),
    info = {
      path: filename,
      text: path.basename(filename)
    };
  if (ignore.includes(info.text)) {
    return;
  }
  if (stats.isDirectory()) {
    info.type = "folder";
    info.nodes = fs.readdirSync(filename).map(function(child) {
      return dirTree(jekyllSite, filename + '/' + child, ignore, selected);
    }).filter(function(child) {
      return child != null;
    }).sort(function(a, b){
      if(a.type == 'file' && b.type == 'folder'){
        return 1;
      } else if(a.type == 'folder' && b.type == 'file'){
        return -1;
      }else if( a.text > b.text){
        return 1;
      } else if(a.text < b.text){
        return -1;
      } else {
        0
      }
    });
  } else {
    // Assuming it's a file. In real life it could be a symlink or
    // something else!
    info.type = "file";
    info.href = '/editor/' + filename.replace(jekyllSite.path+'/', '');
  }
  return info;
}

router.use(function(req, res, next) {
  req.site = req.session.site;
  next();
});

router.get('/files', function(req, res) {
  var files = dirTree(req.site, req.site.path, ignoreFiles);
  res.json([files]);
});

router.get('/', function(req, res) {
  console.log(req.user)
  res.render('editor', {
    layout: false,
  });
});

router.get(':file(*)', function(req, res) {
  fs.readFileAsync(req.site.path + req.params.file).then((fileContent) => {
    res.render('editor', {
      layout: false,
      content: fileContent,
      file: req.params.file
    });
  })
});

router.post(':file(*)', function(req, res) {
  fs.writeFileAsync(req.site.path + req.params.file, req.body.contents).then(() => {
    res.sendStatus(201);
  });
});

module.exports = router;