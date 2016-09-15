'use strict';

var mysql = require('mysql');
var debug_log = require('debug')('express-mysql-session:log');
var debug_error = require('debug')('express-mysql-session:error');
var deprecate = require('depd')('express-mysql-session');
var util = require('util');

var defaultOptions = {
	checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
	expiration: 86400000,// The maximum age of a valid session; milliseconds.
	createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
	connectionLimit: 1,// Number of connections when creating a connection pool
	charset: 'utf8mb4_bin',
	schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
};

module.exports = function(session) {

	var constructorArgs;

	if (typeof session.Store === 'undefined') {
		session = require('express-session');
		constructorArgs = Array.prototype.slice.call(arguments);
	}

	var Store = session.Store;

	var MySQLStore = function(options, connection, cb) {

		debug_log('Creating session store');

		this.options = this.clone(options || {});
		this.setDefaultOptions();

		if (this.options.debug) {
			deprecate('The \'debug\' option has been removed. This module now uses the debug module to output logs and error messages. Run your app with `DEBUG=express-mysql-session* node your-app.js` to have all logs and errors outputted to the console.');
		}

		if (typeof connection === 'function') {
			cb = connection;
			connection = null;
		}

		this.connection = connection || mysql.createPool(this.options);

		var done = function() {

			this.setExpirationInterval();

			if (cb) {
				cb.apply(undefined, arguments);
			}

		}.bind(this);

		if (!this.options.createDatabaseTable) {
			setTimeout(done, 0);
			return;
		}

		this.createDatabaseTable(done);
	};

	util.inherits(MySQLStore, Store);

	MySQLStore.prototype.setDefaultOptions = function() {

		debug_log('Setting default options');

		this.options = this.defaults(this.options, defaultOptions, { recursive: true });
	};

	MySQLStore.prototype.createDatabaseTable = function(cb) {

		debug_log('Creating sessions database table');

		var fs = require('fs');

		fs.readFile(__dirname + '/../schema.sql', 'utf-8', function(error, sql) {

			if (error) {
				return cb && cb(error);
			}

			sql = sql.replace(/`[^`]+`/g, '??');

			var params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.session_id,
				this.options.schema.columnNames.expires,
				this.options.schema.columnNames.data,
				this.options.schema.columnNames.session_id
			];

			this.connection.query(sql, params, function(error) {

				if (error) {
					debug_error('Failed to create sessions database table.');
					debug_error(error);
					return cb && cb(error);
				}

				cb && cb();
			});

		}.bind(this));
	};

	MySQLStore.prototype.get = function(session_id, cb) {

		debug_log('Getting session: ' + session_id);

		var sql = 'SELECT ?? AS data FROM ?? WHERE ?? = ? LIMIT 1';

		var params = [
			this.options.schema.columnNames.data,
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.connection.query(sql, params, function(error, rows) {

			if (error) {
				debug_error('Failed to get session.');
				debug_error(error);
				return cb(error, null);
			}

			try {
				var session = rows[0] ? JSON.parse(rows[0].data) : null;
			} catch (error) {
				debug_error(error);
				return cb(new Error('Failed to parse data for session: ' + session_id));
			}

			cb(null, session);
		});
	};

	MySQLStore.prototype.set = function(session_id, data, cb) {

		debug_log('Setting session: ' + session_id);

		var expires;

		if (data.cookie) {
			if (data.cookie.expires) {
				expires = data.cookie.expires;
			} else if (data.cookie._expires) {
				expires = data.cookie._expires;
			}
		}

		if (!expires) {
			expires = Date.now() + this.options.expiration;
		}

		if (!(expires instanceof Date)) {
			expires = new Date(expires);
		}

		// Use whole seconds here; not milliseconds.
		expires = Math.round(expires.getTime() / 1000);

		data = JSON.stringify(data);

		var sql = 'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ?? = VALUES(??), ?? = VALUES(??)';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			this.options.schema.columnNames.expires,
			this.options.schema.columnNames.data,
			session_id,
			expires,
			data,
			this.options.schema.columnNames.expires,
			this.options.schema.columnNames.expires,
			this.options.schema.columnNames.data,
			this.options.schema.columnNames.data
		];

		this.connection.query(sql, params, function(error) {

			if (error) {
				debug_error('Failed to insert session data.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.touch = function(session_id, data, cb) {

		debug_log('Touching session: ' + session_id);

		var expires;

		if (data.cookie) {
			if (data.cookie.expires) {
				expires = data.cookie.expires;
			} else if (data.cookie._expires) {
				expires = data.cookie._expires;
			}
		}

		if (!expires) {
			expires = Date.now() + this.options.expiration;
		}

		if (!(expires instanceof Date)) {
			expires = new Date(expires);
		}

		// Use whole seconds here; not milliseconds.
		expires = Math.round(expires.getTime() / 1000);

		var sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			expires,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.connection.query(sql, params, function(error) {

			if (error) {
				debug_error('Failed to touch session.');
				debug_error(error);
				return cb && cb(error);
			}

			return cb && cb();
		});
	};

	MySQLStore.prototype.destroy = function(session_id, cb) {

		debug_log('Destroying session: ' + session_id);

		var sql = 'DELETE FROM ?? WHERE ?? = ? LIMIT 1';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.connection.query(sql, params, function(error) {

			if (error) {
				debug_error('Failed to destroy session.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.length = function(cb) {

		debug_log('Getting number of sessions');

		var sql = 'SELECT COUNT(*) FROM ??';

		var params = [
			this.options.schema.tableName
		];

		this.connection.query(sql, params, function(error, rows) {

			if (error) {
				debug_error('Failed to get number of sessions.');
				debug_error(error);
				return cb && cb(error);
			}

			var count = rows[0] ? rows[0]['COUNT(*)'] : 0;

			cb(null, count);
		});
	};

	MySQLStore.prototype.clear = function(cb) {

		debug_log('Clearing all sessions');

		var sql = 'DELETE FROM ??';

		var params = [
			this.options.schema.tableName
		];

		this.connection.query(sql, params, function(error) {

			if (error) {
				debug_error('Failed to clear all sessions.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.clearExpiredSessions = function(cb) {

		debug_log('Clearing expired sessions');

		var sql = 'DELETE FROM ?? WHERE ?? < ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			Math.round(Date.now() / 1000)
		];

		this.connection.query(sql, params, function(error) {

			if (error) {
				debug_error('Failed to clear expired sessions.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.setExpirationInterval = function(interval) {

		interval || (interval = this.options.checkExpirationInterval);

		debug_log('Setting expiration interval: ' + interval + 'ms');

		this.clearExpirationInterval();
		this._expirationInterval = setInterval(this.clearExpiredSessions.bind(this), interval);
	};

	MySQLStore.prototype.clearExpirationInterval = function() {

		debug_log('Clearing expiration interval');

		clearInterval(this._expirationInterval);
		this._expirationInterval = null;
	};

	MySQLStore.prototype.close = function(cb) {

		debug_log('Closing session store');

		this.clearExpirationInterval();

		if (this.connection) {
			this.connection.end(cb);
		} else {
			cb && cb(null);
		}
	};

	MySQLStore.prototype.defaults = function(object, defaultValues, options) {

		if (!this.isObject(object)) {
			return object;
		}

		object = this.clone(object);
		defaultValues = defaultValues || {};
		options = options || {};
		options.recursive = options.recursive === true;

		for (var key in defaultValues) {

			if (typeof object[key] === 'undefined') {
				object[key] = defaultValues[key];
			}

			if (options.recursive) {
				object[key] = this.defaults(object[key], defaultValues[key], options);
			}
		}

		return object;
	}

	MySQLStore.prototype.clone = function(object) {

		return JSON.parse(JSON.stringify(object));
	}

	MySQLStore.prototype.isObject = function(value) {

		var type = typeof value;
		return type === 'function' || type === 'object' && !!value;
	}

	// For backwards compatibility:
	MySQLStore.prototype.closeStore = deprecate.function(
		MySQLStore.prototype.close,
		'The closeStore() method has been deprecated. Use close() instead.'
	);

	// For backwards compatibility:
	MySQLStore.prototype.sync = deprecate.function(
		MySQLStore.prototype.createDatabaseTable,
		'The sync() method has been deprecated. Use createDatabaseTable() instead.'
	);

	if (constructorArgs) {
		// For backwards compatibility.
		// Immediately call as a constructor.
		return new (MySQLStore.bind.apply(MySQLStore, [undefined/* context */].concat(constructorArgs)))();
	}

	return MySQLStore;
};
