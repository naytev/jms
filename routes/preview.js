var express = require('express');
var router = express.Router();
var JekyllUrl = require('../jekyll_url')
var request = require('request');
var fs = require('fs');
var JekyllProxy = require('../jekyll_proxy');


router.use(function(req, res, next){
  JekyllProxy.ensure(req.session.site).then(function(jekyllSite){
    console.log('Ensured site: ', jekyllSite)
    req.session.site = jekyllSite;
    req.site = jekyllSite;
    next();
  }).catch(function(){
    res.send('Couldn\'t start the preview server. Please log out and log back in again')
  })
});

router.get('/:file(*)', function(req, res) {
  var pathPromise;
  if (req.params.file.indexOf('.md') > 0) {
    pathPromise = JekyllUrl.get(req.site, req.params.file);
  } else {
    pathPromise = Promise.resolve("/"+req.params.file);
  }
  pathPromise.then(function(path){
    var url = `http://localhost:${req.site.port}${path}`;
    var stream = request(url);
    console.log('request made', url)
    stream.on('error', function(err){
      console.error('uncaughtException: ' + err.message);
      console.error(err.stack);   
    });
    stream.pipe(res);
  }).catch(function(e){
    console.log('error', e);
  });
});

module.exports = router;