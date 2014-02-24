# express-mysql-session

A MySQL session store for express.js


## Installation

The quick way:
```
npm install express-mysql-session
```

The other, slower way is to add `express-mysql-session` to your project's `package.json` file:
```
{
  "name": "Your App",
  "dependencies": {
    "express-mysql-session": "latest"
  }
}
```
*It is recommended that you specify a hard-coded version number instead of `latest`*

*See https://npmjs.org/package/express-mysql-session for the latest release version*

Then install it by running the following, from your project's directory:
```
npm install
```


## Usage

```js
var express = require('express')
var app = module.exports = express()

var SessionStore = require('express-mysql-session')

app.configure(function() {

	var options = {
		host: 'localhost',
		port: 3306,
		user: 'session_test',
		password: 'password',
		database: 'session_test'
	}

	app.use(express.logger())
	app.use(express.cookieParser())
	app.use(express.bodyParser())

	app.use(express.session({

		key: 'session_cookie_name',
		secret: 'session_cookie_secret',
		store: new SessionStore(options)

	}))

})
```


## How to Run Tests

First, you must create a test MySQL database in which to run the tests, with the following connection information:
```js
{
		host: 'localhost',
		port: 3306,
		user: 'session_test',
		password: 'password',
		database: 'session_test'
}
```
*These database credentials are located at `test/config/database.js`*

From your project's base directory, to run all the tests:
```
mocha
```
*You may need to run `npm install` locally to get the dev dependencies.*

To run only the unit tests:
```
mocha test/unit
```
To run only the integration tests:
```
mocha test/integration
```