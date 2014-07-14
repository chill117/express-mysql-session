# express-mysql-session [![Build Status](https://travis-ci.org/chill117/express-mysql-session.svg?branch=master)](https://travis-ci.org/chill117/express-mysql-session)

A MySQL session store for express.js


## Installation

Add to your application via `npm`:
```
npm install express-mysql-session --save
```
This will install `express-mysql-session` and add it to your application's `package.json` file.


## Usage

To use `express-mysql-session`, simply use it with your express session middleware, like this:
```js
var express = require('express')
var app = module.exports = express()

var session = require('express-session')
var SessionStore = require('express-mysql-session')

var options = {
	host: 'localhost',
	port: 3306,
	user: 'session_test',
	password: 'password',
	database: 'session_test'
}

app.use(session({
	key: 'session_cookie_name',
	secret: 'session_cookie_secret',
	store: new SessionStore(options)
}))
```

### Options

Here is a list of all available options:
```js
var options = {
	host: 'localhost',// Host name for database connection.
	port: 3306,// Port number for database connection.
	user: 'session_test',// Database user.
	password: 'password',// Password for the above database user.
	database: 'session_test',// Database name.
	checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
	expiration: 86400000,// The maximum age of a valid session; milliseconds.
	autoReconnect: true,// Whether or not to re-establish a database connection after a disconnect.
	reconnectDelay: [
		500,// Time between each attempt in the first group of reconnection attempts; milliseconds.
		1000,// Time between each attempt in the second group of reconnection attempts; milliseconds.
		5000,// Time between each attempt in the third group of reconnection attempts; milliseconds.
		30000,// Time between each attempt in the fourth group of reconnection attempts; milliseconds.
		300000// Time between each attempt in the fifth group of reconnection attempts; milliseconds.
	],
	reconnectDelayGroupSize: 5,// Number of reconnection attempts per reconnect delay value.
	maxReconnectAttempts: 25,// Maximum number of reconnection attempts. Set to 0 for unlimited.
	useConnectionPooling: false,// Whether or not to use connection pooling.
	keepAlive: true,// Whether or not to send keep-alive pings on the database connection.
	keepAliveInterval: 30000,// How frequently keep-alive pings will be sent; milliseconds.
}
```


## Contributing

There are a number of ways you can contribute:

* **Improve or correct the documentation** - All the documentation is in this `readme.md` file. If you see a mistake, or think something should be clarified or expanded upon, please [submit a pull request](https://github.com/chill117/express-mysql-session/pulls/new)
* **Report a bug** - Please review [existing issues](https://github.com/chill117/express-mysql-session/issues) before submitting a new one; to avoid duplicates. If you can't find an issue that relates to the bug you've found, please [create a new one](https://github.com/chill117/express-mysql-session/issues).
* **Request a feature** - Again, please review the [existing issues](https://github.com/chill117/express-mysql-session/issues) before posting a feature request. If you can't find an existing one that covers your feature idea, please [create a new one](https://github.com/chill117/express-mysql-session/issues).
* **Fix a bug** - Have a look at the [existing issues](https://github.com/chill117/express-mysql-session/issues) for the project. If there's a bug in there that you'd like to tackle, please feel free to do so. I would ask that when fixing a bug, that you first create a failing test that proves the bug. Then to fix the bug, make the test pass. This should hopefully ensure that the bug never creeps into the project again. After you've done all that, you can [submit a pull request](https://github.com/chill117/express-mysql-session/pulls/new) with your changes.

Before you contribute code, please read through at least some of the source code for the project. I would appreciate it if any pull requests for source code changes follow the coding style of the rest of the project.

Now if you're still interested, you'll need to get your local environment configured.


### Configure Local Environment

#### Step 1: Get the Code

First, you'll need to pull down the code from GitHub:
```
git clone git@github.com:chill117/express-mysql-session.git
```

#### Step 2: Install Dependencies

Second, you'll need to install the project dependencies as well as the dev dependencies. To do this, simply run the following from the directory you created in step 1:
```
npm install
```

#### Step 3: Set Up the Test Database

Now, you'll need to set up a local test database:
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


### Running Tests

With your local environment configured, running tests is as simple as:
```
npm test
```
This module supports node.js `0.8.x` and `0.10.x`. If you are planning to contribute, please test your changes against all supported versions of node. If you need help setting up multiple versions of node in your development environment, [this article](https://degreesofzero.com/article/how-to-install-multiple-versions-of-nodejs.html) can guide you through the process.