var express = require('express')
var app = module.exports = express()

app.configure(function() {

	var config = require(__dirname + '/../config/config.js')

	var SessionStore = require('./session_store.js')

	app.use(express.logger())
	app.use(express.cookieParser())
	app.use(express.bodyParser())

	app.use(express.session({

		key: config.session_cookie_name,
		secret: config.session_cookie_secret,
		store: SessionStore

	}))

})

app.listen(3000)

app.get('/test', function(req, res) {

	res.json(200, 'hi!')

})

module.exports = app