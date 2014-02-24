var options = require('./config/database.js')
var SessionStore = require('../index.js')

module.exports = new SessionStore(options)