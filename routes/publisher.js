var express = require('express');
var router = express.Router();
var Git = require('nodegit');
var GitHubApi = require('github');
var hat = require('hat');

router.use(function(req, res, next) {
  req.site = req.session.site;
  next();
});
router.get('/refresh', function(req, res){
  var repoRef;
  Git.Repository.open(req.site.path).then((repo) => {
    repoRef = repo;
    return repoRef.fetchAll({
        callbacks: {
          certificateCheck: function() {
            return 1;
          },
          credentials: function() {
            return Git.Cred.userpassPlaintextNew(req.user.accessToken, "x-oauth-basic");
          }
        }
      });
  }).then(function() {
    return repoRef.mergeBranches("dev", "origin/dev");
  }).then(function(){
    res.redirect('/editor');
  }).catch(function(e){
    console.log('Refresh Error', e);
  })
})
router.get('/save', function(req, res) {
  var indexRef, repoRef, branchName;
  Git.Repository.open(req.site.path).then((repo) => {
    repoRef = repo;
    return repoRef.getHeadCommit()
  }).then((commit) => {
    branchName = req.user.username + "--" + hat();
    return repoRef.createBranch(
      branchName,
      commit,
      0,
      repoRef.defaultSignature(),
      "Created new-branch on HEAD");
  }).then(function() {
    return repoRef.checkoutBranch(branchName);
  }).then(function() {
    return repoRef.refreshIndex()
  }).then((index) => {
    indexRef = index;
    return indexRef.addAll()
  }).then(() => {
    indexRef.write()
    return indexRef.writeTree()
  }).then((oid) => {
    res.redirect('/publish/preview/' + oid);
  }).catch((err) => {
    console.log(err);
  })
});

router.get('/preview/:oid', function(req, res) {
  Git.Repository.open(req.site.path).then((repo) => {
    return repo.getStatus();
  }).then((statuses) => {
    var fileNames = statuses.map((file) => {
      return file.path() + " CHANGED"
    })
    res.render('publish', {
      canPublish: fileNames.length > 0,
      files: fileNames
    })
  }).catch(function(e){
    console.log('error', e)
  })
});

router.post('/preview/:oid', function(req, res) {
  var repoRef, commitRef, branchNameRef;
  var github = new GitHubApi({
    debug: true
  });
  github.authenticate({
    type: "oauth",
    token: req.user.accessToken
  });

  Git.Repository.open(req.site.path).then((repo) => {
      repoRef = repo;
      return Git.Reference.nameToId(repo, "HEAD")
    }).then(function(head) {
      return repoRef.getCommit(head);
    })
    .then(function(parent) {
      console.log('creatingCommit')
      var author = Git.Signature.now(req.user.username, req.user.id);
      return repoRef.createCommit("HEAD", author, author, req.body.info, req.params.oid, [parent]);
    })
    .then(function(commitId) {
      commitRef = commitId;
      return repoRef.getCurrentBranch();
    }).then(function(branch){
      branchNameRef = branch.shorthand();
      return repoRef.getRemote("origin");
    }).then(function(remote) {
      return remote.push(['HEAD:refs/heads/'+branchNameRef], {
        callbacks: {
          certificateCheck: function() {
            return 1;
          },
          credentials: function() {
            console.log(req.user.accessToken)
            return Git.Cred.userpassPlaintextNew(req.user.accessToken, "x-oauth-basic");
          }
        }
      });
    }).then(function() {
      github.pullRequests.create({
        user: 'naytev',
        repo: 'naytev-blog',
        title: req.body.info.substr(0, 100),
        head: branchNameRef,
        base: 'dev'
      }, function() {
        res.redirect('/editor');
      });
    }).catch(function(e) {
      console.log(e);
    });
});


router.get('/reset/:file(*)', function(req, res){
  Git.Repository.open(req.site.path).then(function(repo){
    var opts = {
      checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      paths: req.params.file
    };

    return Git.Checkout.head(repo, opts)
    
  }).then(function() {
    res.redirect('back')
  }).catch(function(e){
    console.log(e);
  })
});
module.exports = router;