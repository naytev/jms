var express = require('express');
var router = express.Router();
var glob = require('glob-promise');
var fs = require('fs-extra-promise');
var path = require('path');
var fm = require('front-matter');

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
  var folderName = req.site.path + '/_templates';
  if(fs.existsSync(folderName)){
    req.templates = fs.readdirSync(folderName).map((child) => {
      var fullPath = folderName + '/' + child;
      var contents = fs.readFileSync(fullPath).toString('utf-8');
      var content = fm(contents)
      return {
        path: fullPath,
        modalLabel: 'Create' + content.attributes.template_name,
        name: content.attributes.template_name
      }
    });
  }
  next();
});

router.post('/template', function(req, res){
  var contents = fs.readFileSync(req.body.template).toString('utf-8');
  var fullFileName = req.site.path + '/' + req.body.filename;
  fs.ensureFileSync(fullFileName)
  fs.writeFileSync(fullFileName, contents);
  res.redirect('/editor/' + req.body.filename);
})

router.post('/file', upload.single('file'), function(req, res){
  var fullFileName = req.site.path + '/' + req.body.filename;
  var dirName = path.dirname(fullFileName);
  fs.ensureDirSync(dirName);
  fs.renameSync(req.file.path, fullFileName);
  res.redirect('back');

})
router.get('/files', function(req, res) {
  var files = dirTree(req.site, req.site.path, ignoreFiles);
  res.json([files]);
});

router.get('/', function(req, res) {
  console.log(req.user)
  res.render('editor', {
    templates: req.templates,
    layout: false,
  });
});

router.get(':file(*)', function(req, res) {
  fs.readFileAsync(req.site.path + req.params.file).then((fileContent) => {
    res.render('editor', {
      layout: false,
      templates: req.templates,
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