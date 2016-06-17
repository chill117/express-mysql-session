# express-mysql-session

A MySQL session store for [express.js](http://expressjs.com/).

[![Build Status](https://travis-ci.org/chill117/express-mysql-session.svg?branch=master)](https://travis-ci.org/chill117/express-mysql-session) [![Status of Dependencies](https://david-dm.org/chill117/express-mysql-session.svg)](https://david-dm.org/chill117/express-mysql-session)


## Installation

Add to your application via `npm`:
```
npm install express-mysql-session --save
```
This will install `express-mysql-session` and add it to your application's `package.json` file.


## Note for Older Versions

For users who are still using express-mysql-session `0.x`. Changes have been made to the constructor, which are backwards compatible, but you could run into troubles if using an older version of this module with the latest documentation. You can find the documentation for the older version [here](https://github.com/chill117/express-mysql-session/tree/9fbcf51416a00a7a525c1e6e431033125a2945b0).



## How to Use

Use with your express session middleware, like this:
```js
var express = require('express');
var app = module.exports = express();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
	host: 'localhost',
	port: 3306,
	user: 'session_test',
	password: 'password',
	database: 'session_test'
};

var sessionStore = new MySQLStore(options);

app.use(session({
	key: 'session_cookie_name',
	secret: 'session_cookie_secret',
	store: sessionStore,
	resave: true,
	saveUninitialized: true
}));
```

### With an existing MySQL connection

To pass in an existing MySQL database connection, you would do something like this:
```js
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'password',
    database: 'db_name'
};

var connection = mysql.createConnection(options);
var sessionStore = new MySQLStore({}/* session store options */, connection);
```

### Closing the session store

To cleanly close the session store:
```js
sessionStore.close();
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
	createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
	schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
};
```
There are additional options you can provide, which will be passed to an instance of [mysql-connection-manager](https://github.com/chill117/mysql-connection-manager#options).


#### Configurable sessions table and column names

You can override the default sessions database table name and column names via the `schema` option:

```js
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
	host: 'localhost',
	port: 3306,
	user: 'session_test',
	password: 'password',
	database: 'session_test',
	schema: {
		tableName: 'custom_sessions_table_name',
		columnNames: {
			session_id: 'custom_session_id',
			expires: 'custom_expires_column_name',
			data: 'custom_data_column_name'
		}
	}
};

var sessionStore = new MySQLStore(options);
```


### Debugging

`express-mysql-session` uses the [debug module](https://github.com/visionmedia/debug) to output debug messages to the console. To output all debug messages, run your node app with the `DEBUG` environment variable:
```
DEBUG=express-mysql-session* node your-app.js
```
This will output log messages as well as error messages from `express-mysql-session`.

If you also might need MySQL-related debug and error messages, include `mysql-connection-manager` as well:
```
DEBUG=express-mysql-session*,mysql-connection-manager node your-app.js
```


## Contributing

There are a number of ways you can contribute:

* **Improve or correct the documentation** - All the documentation is in this readme file. If you see a mistake, or think something should be clarified or expanded upon, please [submit a pull request](https://github.com/chill117/express-mysql-session/pulls/new)
* **Report a bug** - Please review [existing issues](https://github.com/chill117/express-mysql-session/issues) before submitting a new one; to avoid duplicates. If you can't find an issue that relates to the bug you've found, please [create a new one](https://github.com/chill117/express-mysql-session/issues).
* **Request a feature** - Again, please review the [existing issues](https://github.com/chill117/express-mysql-session/issues) before posting a feature request. If you can't find an existing one that covers your feature idea, please [create a new one](https://github.com/chill117/express-mysql-session/issues).
* **Fix a bug** - Have a look at the [existing issues](https://github.com/chill117/express-mysql-session/issues) for the project. If there's a bug in there that you'd like to tackle, please feel free to do so. I would ask that when fixing a bug, that you first create a failing test that proves the bug. Then to fix the bug, make the test pass. This should hopefully ensure that the bug never creeps into the project again. After you've done all that, you can [submit a pull request](https://github.com/chill117/express-mysql-session/pulls/new) with your changes.

Before you contribute code, please read through at least some of the source code for the project. I would appreciate it if any pull requests for source code changes follow the coding style of the rest of the project.

Now if you're still interested, you'll need to get your local environment configured.


### Configure Local Environment

#### Step 1: Get the Code

First, you'll need to pull down the code from GitHub:
```
git clone https://github.com/chill117/express-mysql-session.git
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
};
```
*The test database settings are located in [test/config.js](https://github.com/chill117/express-mysql-session/blob/master/test/config.js)*

Alternatively, you can provide custom database configurations via environment variables:
```
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="session_test"
DB_PASS="password"
DB_NAME="session_test"
```


### Running Tests

With your local environment configured, running tests is as simple as:
```
npm test
```


## Changelog

* v1.1.1:
  * Fix for express-session integration when "cookie.maxAge" is set to NULL.
* v1.1.0:
  * Added [touch](https://github.com/expressjs/session#storetouchsid-session-callback) method.
  * Deprecated `MySQLStore.closeStore` - should use `MySQLStore.close` instead.
  * Fixes for issues: [#46](https://github.com/chill117/express-mysql-session/issues/46)
* v1.0.0:
  * Changed constructor interface. Must now pass session module to get `MySQLStore` constructor object. See [How to Use](https://github.com/chill117/express-mysql-session#how-to-use) for more information.
  * Fixes for issues: [#28](https://github.com/chill117/express-mysql-session/issues/28), [#33](https://github.com/chill117/express-mysql-session/issues/33).
