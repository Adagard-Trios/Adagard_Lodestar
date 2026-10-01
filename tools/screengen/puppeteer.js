// puppeteer-core from this folder's node_modules (npm install), or from $PUPPETEER.
// It drives the Chrome already on the machine ($CHROME, default: the standard Windows install).
try {
  module.exports = require(process.env.PUPPETEER || 'puppeteer-core');
} catch (e) {
  module.exports = require('C:/tmp/cap/node_modules/puppeteer-core');
}
