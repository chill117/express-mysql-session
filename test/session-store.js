var SessionStore = require('../index')
var databaseConfig = require('./config/database')

var sessionStore = module.exports = new SessionStore({
	host: databaseConfig.host,
	port: databaseConfig.port,
	user: databaseConfig.user,
	password: databaseConfig.password,
	database: databaseConfig.database
})