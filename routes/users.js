var express = require('express');
var router = express.Router();
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var Git = require("nodegit");
var fs = require('fs-extra-promise');
var JekyllProxy = require('../jekyll_proxy');


passport.use(new GitHubStrategy({
    clientID: process.env['GITHUB_CLIENT_ID'],
    clientSecret: process.env['GITHUB_CLIENT_SECRET'],
    callbackURL: process.env['GITHUB_OAUTH_REDIRECT']
  },
  function(accessToken, refreshToken, profile, cb) {
    cb(null, {
      accessToken,
      id: profile.id,
      displayName: profile.displayName,
      username: profile.username
    });
  }
));

router.get('/auth/github',
  passport.authenticate('github'));

router.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    var rootpath = process.env["BASE_PATH"] + "/" + req.user.username;
    let promise = Promise.resolve();
    if (!fs.existsSync(rootpath)) {
      promise = Git.Clone(process.env["REPO_URL"], rootpath);
    }
    promise.then(function(repo) {
      var jekyllSite = JekyllProxy.makeSite(req.user.username, rootpath);
      return JekyllProxy.startServer(jekyllSite);
    }).then(function(runningSite){
      req.session.site = runningSite;
      res.redirect('/editor');
    }).catch(function(err) {
      console.log("Error", err);
      res.redirect('/');
    });

  });
module.exports = router;