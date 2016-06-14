const jekyllProxy = require('./jekyll_proxy');
const startServer = jekyllProxy.startServer;
const closeServer = jekyllProxy.closeServer;

const jekyllSite = {
  id: 'Mike',
  path: '/Users/mbseid/Dev/naytev/naytev-blog'
}

startServer(jekyllSite);

setTimeout(() => {
  closeServer(jekyllSite);
}, 20000)