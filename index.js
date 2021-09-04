'use strict';

var _ = require('underscore');
var mysql = require('mysql');
var path = require('path');
var util = require('util');

var debug = {
	log: require('debug')('express-mysql-session:log'),
	error: require('debug')('express-mysql-session:error')
};

module.exports = function(session) {

	var constructorArgs;

	if (_.isUndefined(session.Store)) {
		session = require('express-session');
		constructorArgs = Array.prototype.slice.call(arguments);
	}

	var Store = session.Store;

	var MySQLStore = function(options, connection, cb) {

		debug.log('Creating session store');

		if (_.isFunction(connection)) {
			cb = connection;
			connection = null;
		}

		this.connection = connection;
		this.setOptions(options);

		if (!this.connection) {
			this.connection = mysql.createPool(this.options);
		}

		var done = function() {

			if (this.options.clearExpired) {
				this.setExpirationInterval();
			}

			if (cb) {
				cb.apply(undefined, arguments);
			}

		}.bind(this);

		if (this.options.createDatabaseTable) {
			this.createDatabaseTable(done);
		} else {
			_.defer(done);
		}
	};

	util.inherits(MySQLStore, Store);

	MySQLStore.prototype.defaultOptions = {
		// Whether or not to automatically check for and clear expired sessions:
		clearExpired: true,
		// How frequently expired sessions will be cleared; milliseconds:
		checkExpirationInterval: 900000,
		// The maximum age of a valid session; milliseconds:
		expiration: 86400000,
		// Whether or not to create the sessions database table, if one does not already exist:
		createDatabaseTable: true,
		// Number of connections when creating a connection pool:
		connectionLimit: 1,
		// Whether or not to end the database connection when the store is closed:
		endConnectionOnClose: true,
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

	MySQLStore.prototype.setOptions = function(options) {

		this.options = _.defaults({}, options || {}, {
			// The default value of this option depends on whether or not a connection was passed to the constructor.
			endConnectionOnClose: !this.connection,
		}, this.defaultOptions);

		this.options.schema = _.defaults({}, this.options.schema || {}, this.defaultOptions.schema);
		this.options.schema.columnNames = _.defaults({}, this.options.schema.columnNames || {}, this.defaultOptions.schema.columnNames);
		this.validateOptions(this.options);
	};

	MySQLStore.prototype.validateOptions = function(options) {

		var allowedColumnNames = _.keys(this.defaultOptions.schema.columnNames);
		var userDefinedColumnNames = _.keys(options.schema.columnNames);
		_.each(userDefinedColumnNames, function(userDefinedColumnName) {
			if (!_.contains(allowedColumnNames, userDefinedColumnName)) {
				throw new Error('Unknown column specified ("' + userDefinedColumnName + '"). Only the following columns are configurable: "session_id", "expires", "data". Please review the documentation to understand how to correctly use this option.');
			}
		});
	};

	MySQLStore.prototype.createDatabaseTable = function(cb) {

		debug.log('Creating sessions database table');

		var fs = require('fs');
		var schemaFilePath = path.join(__dirname, 'schema.sql');

		fs.readFile(schemaFilePath, 'utf-8', function(error, sql) {

			if (error) {
				debug.error('Failed to read schema file.');
				debug.error(error);
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

			this.query(sql, params, function(error) {

				if (error) {
					debug.error('Failed to create sessions database table.');
					debug.error(error);
					return cb && cb(error);
				}

				cb && cb();
			});

		}.bind(this));
	};

	MySQLStore.prototype.get = function(session_id, cb) {

		debug.log('Getting session:', session_id);

		// LIMIT not needed here because the WHERE clause is searching by the table's primary key.
		var sql = 'SELECT ?? AS data, ?? as expires FROM ?? WHERE ?? = ?';

		var params = [
			this.options.schema.columnNames.data,
			this.options.schema.columnNames.expires,
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.query(sql, params, function(error, rows) {

			if (error) {
				debug.error('Failed to get session:', session_id);
				debug.error(error);
				return cb(error, null);
			}

			var row = rows[0] || null;
			if (!row) {
				return cb(null, null);
			}

			// Check the expires time.
			var now = Math.round(Date.now() / 1000);
			if (row.expires < now) {
				// Session has expired.
				return cb(null, null);
			}

			var data = row.data;
			if (_.isString(data)) {
				try {
					data = JSON.parse(data);
				} catch (error) {
					debug.error('Failed to parse data for session (' + session_id + ')');
					debug.error(error);
					return cb(error);
				}
			}

			cb(null, data);
		});
	};

	MySQLStore.prototype.set = function(session_id, data, cb) {

		debug.log('Setting session:', session_id);

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

		this.query(sql, params, function(error) {

			if (error) {
				debug.error('Failed to insert session data.');
				debug.error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.touch = function(session_id, data, cb) {

		debug.log('Touching session:', session_id);

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

		// LIMIT not needed here because the WHERE clause is searching by the table's primary key.
		var sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			expires,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.query(sql, params, function(error) {

			if (error) {
				debug.error('Failed to touch session (' + session_id + ')');
				debug.error(error);
				return cb && cb(error);
			}

			return cb && cb();
		});
	};

	MySQLStore.prototype.destroy = function(session_id, cb) {

		debug.log('Destroying session:', session_id);

		// LIMIT not needed here because the WHERE clause is searching by the table's primary key.
		var sql = 'DELETE FROM ?? WHERE ?? = ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		this.query(sql, params, function(error) {

			if (error) {
				debug.error('Failed to destroy session (' + session_id + ')');
				debug.error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.length = function(cb) {

		debug.log('Getting number of sessions');

		var sql = 'SELECT COUNT(*) FROM ?? WHERE ?? >= ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			Math.round(Date.now() / 1000)
		];

		this.query(sql, params, function(error, rows) {

			if (error) {
				debug.error('Failed to get number of sessions.');
				debug.error(error);
				return cb && cb(error);
			}

			var count = rows[0] ? rows[0]['COUNT(*)'] : 0;

			cb(null, count);
		});
	};

	MySQLStore.prototype.all = function(cb) {

		debug.log('Getting all sessions');

		var sql = 'SELECT * FROM ?? WHERE ?? >= ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			Math.round(Date.now() / 1000)
		];

		this.query(sql, params, function(error, rows) {

			if (error) {
				debug.error('Failed to get all sessions.');
				debug.error(error);
				return cb && cb(error);
			}

			var sessions = _.chain(rows).map(function(row) {
				var session_id = row.session_id;
				var data = row.data;
				if (_.isString(data)) {
					try {
						data = JSON.parse(data);
					} catch (error) {
						debug.error('Failed to parse data for session (' + session_id + ')');
						debug.error(error);
						return null;
					}
				}
				return [session_id, data];
			}).compact().object().value();

			cb && cb(null, sessions);
		});
	};

	MySQLStore.prototype.clear = function(cb) {

		debug.log('Clearing all sessions');

		var sql = 'DELETE FROM ??';

		var params = [
			this.options.schema.tableName
		];

		this.query(sql, params, function(error) {

			if (error) {
				debug.error('Failed to clear all sessions.');
				debug.error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.clearExpiredSessions = function(cb) {

		debug.log('Clearing expired sessions');

		var sql = 'DELETE FROM ?? WHERE ?? < ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			Math.round(Date.now() / 1000)
		];

		this.query(sql, params, function(error) {

			if (error) {
				debug.error('Failed to clear expired sessions.');
				debug.error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	MySQLStore.prototype.query = function(sql, params, cb) {

		var done = _.once(cb);
		var promise = this.connection.query(sql, params, done);

		if (promise && _.isFunction(promise.then) && _.isFunction(promise.catch)) {
			// Probably a promise.
			promise.then(function(result) {
				var rows = result[0];
				var fields = result[1];
				done(null, rows, fields);
			}).catch(function(error) {
				done(error);
			});
		}
	};

	MySQLStore.prototype.setExpirationInterval = function(interval) {

		interval || (interval = this.options.checkExpirationInterval);

		debug.log('Setting expiration interval to', interval + 'ms');

		this.clearExpirationInterval();
		this._expirationInterval = setInterval(this.clearExpiredSessions.bind(this), interval);
	};

	MySQLStore.prototype.clearExpirationInterval = function() {

		debug.log('Clearing expiration interval');

		clearInterval(this._expirationInterval);
		this._expirationInterval = null;
	};

	MySQLStore.prototype.close = function(cb) {

		debug.log('Closing session store');

		this.clearExpirationInterval();

		var done = _.once(cb || _.noop);

		if (this.connection && this.options.endConnectionOnClose) {
			var promise = this.connection.end(done);
			if (promise && _.isFunction(promise.then) && _.isFunction(promise.catch)) {
				// Probably a promise.
				promise.then(function() {
					done(null);
				}).catch(function(error) {
					done(error);
				});
			}
		} else {
			done(null);
		}
	};

	if (constructorArgs) {
		// For backwards compatibility.
		// Immediately call as a constructor.
		return new (MySQLStore.bind.apply(MySQLStore, [undefined/* context */].concat(constructorArgs)))();
	}

	return MySQLStore;
};
