[![Build Status](https://travis-ci.org/Slumber86/express-oracle-session.svg?branch=master)](https://travis-ci.org/Slumber86/express-oracle-session)

# express-oracle-session

A Oracle session store for [express.js](http://expressjs.com/).

## Installation

Add to your application via `npm`:
```
npm install express-oracle-session --save
```
This will install `express-oracle-session` and add it to your application's `package.json` file.


## How to Use

Use with your express session middleware, like this:
```js
var express = require('express');
var app = module.exports = express();
var session = require('express-session');
var oracleDbStore = require('express-oracle-session')(session);

var options = {
	user: 'session_test',
	password: 'password',
	connectString: 'localhost/orcl'
};

var sessionStore = new oracleDbStore(options);

app.use(session({
	key: 'session_cookie_name',
	secret: 'session_cookie_secret',
	store: sessionStore,
	resave: true,
	saveUninitialized: true
}));
```

The session store will internally create a `Oracle` connection pool which handles the (re)connection to the database.

### With an existing Oracle connection or pool

To pass in an existing Oracle database connection or pool, you would do something like this:
```js
var oracledb = require('oracledb');
var session = require('express-session');
var oracleDbStore = require('express-oracle-session')(session);

var options = {
	user: 'session_test',
	password: 'password',
	connectString: 'localhost/orcl'
};

oracledb.createPool(options, function(err, pool) {
      if (err) {
        console.error("createPool() error: " + err.message);
        return;
			}
			pool.getConnection(function(err, connection) {
	 			if (err) {
		 			handleError(response, "getConnection() error", err);
		 			return;
				}
				var sessionStore = new oracleDbStore({}/* session store options */, connection);
			});
		});
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
	user: 'session_test',
	password: 'password',
	connectString: 'localhost/orcl',
	externalAuth: true,
	checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
	expiration: 86400000,// The maximum age of a valid session; milliseconds.
	createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
	connectionLimit: 1,// Number of connections when creating a connection pool
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


#### Configurable sessions table and column names

You can override the default sessions database table name and column names via the `schema` option:

```js
var session = require('express-session');
var oracleDbStore = require('express-oracle-session')(session);

var options = {
	user: 'session_test',
	password: 'password',
	connectString: 'localhost/orcl',
	schema: {
		tableName: 'custom_sessions_table_name',
		columnNames: {
			session_id: 'custom_session_id',
			expires: 'custom_expires_column_name',
			data: 'custom_data_column_name'
		}
	}
};

var sessionStore = new oracleDbStore(options);
```


### Debugging

`express-oracle-session` uses the [debug module](https://github.com/visionmedia/debug) to output debug messages to the console. To output all debug messages, run your node app with the `DEBUG` environment variable:
```
DEBUG=express-oracle-session* node your-app.js
```
This will output log messages as well as error messages from `express-oracle-session`.


## Contributing

There are a number of ways you can contribute:

* **Improve or correct the documentation** - All the documentation is in this readme file. If you see a mistake, or think something should be clarified or expanded upon, please [submit a pull request](https://github.com/chill117/express-oracle-session/pulls/new)
* **Report a bug** - Please review [existing issues](https://github.com/chill117/express-oracle-session/issues) before submitting a new one; to avoid duplicates. If you can't find an issue that relates to the bug you've found, please [create a new one](https://github.com/chill117/express-oracle-session/issues).
* **Request a feature** - Again, please review the [existing issues](https://github.com/chill117/express-oracle-session/issues) before posting a feature request. If you can't find an existing one that covers your feature idea, please [create a new one](https://github.com/chill117/express-oracle-session/issues).
* **Fix a bug** - Have a look at the [existing issues](https://github.com/chill117/express-oracle-session/issues) for the project. If there's a bug in there that you'd like to tackle, please feel free to do so. I would ask that when fixing a bug, that you first create a failing test that proves the bug. Then to fix the bug, make the test pass. This should hopefully ensure that the bug never creeps into the project again. After you've done all that, you can [submit a pull request](https://github.com/chill117/express-oracle-session/pulls/new) with your changes.

Before you contribute code, please read through at least some of the source code for the project. I would appreciate it if any pull requests for source code changes follow the coding style of the rest of the project.

Now if you're still interested, you'll need to get your local environment configured.


### Configure Local Environment

#### Step 1: Get the Code

First, you'll need to pull down the code from GitHub:
```
git clone https://github.com/chill117/express-oracle-session.git
```

#### Step 2: Install Dependencies

Second, you'll need to install the project dependencies as well as the dev dependencies. To do this, simply run the following from the directory you created in step 1:
```
npm install
```

#### Step 3: Set Up the Test Database

TBD


### Running Tests

With your local environment configured, running tests is as simple as:
```
npm test
```


## Changelog
