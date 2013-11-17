# express-mysql-session

A MySQL session store for express.js



## Installation

Add `express-mysql-session` to your project's `package.json` file:
```
{
  "name": "Your App",
  "dependencies": {
    "express-mysql-session": "0.0.2"
  }
}
```

Then install it by running the following:
```
npm install
```



## Usage

```
var express = require('express')
var app = module.exports = express()

app.configure(function() {

	var options = {}

	options.db = {}
	options.db.name = 'database_name'
	options.db.user = 'database_user'
	options.db.pass = 'database_pass'
	options.db.options = {}
	options.db.options.host = 'database_host'
	options.db.options.port = 'database_port'
	options.db.options.logging = false// Disables logging in Sequelize
	options.debug = false// Disables console log messages in express-mysql-session

	var SessionStore = require('express-mysql-session')(options, express)

	app.use(express.logger())
	app.use(express.cookieParser())
	app.use(express.bodyParser())

	app.use(express.session({

		key: 'session_cookie_name',
		secret: 'session_cookie_secret',
		store: SessionStore

	}))

})
```



## How to Run Tests

From your project's base directory:
```
mocha
```

*NOTE:*
You may need to run `npm install` locally to get the dev dependencies.