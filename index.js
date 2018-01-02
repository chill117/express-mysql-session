'use strict';

var _ = require('underscore');
var mysql = require('mysql');
var path = require('path');
var util = require('util');

var debug = {
	log: require('debug')('express-mysql-session:log'),
	error: require('debug')('express-mysql-session:error')
};

var deprecate = require('depd')('express-mysql-session');

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

		var defaultOptions = {
			// How frequently expired sessions will be cleared; milliseconds:
			checkExpirationInterval: 900000,
			// The maximum age of a valid session; milliseconds:
			expiration: 86400000,
			// Whether or not to create the sessions database table, if one does not already exist:
			createDatabaseTable: true,
			// Number of connections when creating a connection pool:
			connectionLimit: 1,
			// Whether or not to end the database connection when the store is closed:
			endConnectionOnClose: !connection,
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

		this.options = _.defaults(options || {}, defaultOptions);
		this.options.schema = _.defaults(this.options.schema, defaultOptions.schema);
		this.options.schema.columnNames = _.defaults(this.options.schema.columnNames, defaultOptions.schema.columnNames);

		if (this.options.debug) {
			deprecate('The \'debug\' option has been removed. This module now uses the debug module to output logs and error messages. Run your app with `DEBUG=express-mysql-session* node your-app.js` to have all logs and errors outputted to the console.');
		}

		this.connection = connection || mysql.createPool(this.options);

		var done = function() {

			this.setExpirationInterval();

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

	MySQLStore.prototype.createDatabaseTable = function(cb) {

		debug.log('Creating sessions database table');

		var fs = require('fs');
		var schemaFilePath = path.join(__dirname, 'schema.sql');

		fs.readFile(schemaFilePath, 'utf-8', async function(error, sql) {

			if (error) {
				debug.error('Failed to read schema file.');
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

			const result = await this.connection.query(sql, params);
            cb && cb();

		}.bind(this));
	};

	MySQLStore.prototype.get = async function(session_id, cb) {

		debug.log('Getting session:', session_id);

		var sql = 'SELECT ?? AS data FROM ?? WHERE ?? = ? LIMIT 1';

		var params = [
			this.options.schema.columnNames.data,
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		const rows = await this.connection.query(sql, params);

        try {
            var session = rows[0] ? JSON.parse(rows[0][0].data) : null;
            cb(null, session);
        } catch (error) {
            debug.error(error);
            return cb(new Error('Failed to parse data for session:', session_id));
        }

	};

	MySQLStore.prototype.set = async function(session_id, data, cb) {

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
		var rows = await this.connection.query(sql, params);
        cb && cb();
	};

	MySQLStore.prototype.touch = async function(session_id, data, cb) {

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

		var sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ? LIMIT 1';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			expires,
			this.options.schema.columnNames.session_id,
			session_id
		];
		var rows = await this.connection.query(sql, params);
        return cb && cb();
	};

	MySQLStore.prototype.destroy = async function(session_id, cb) {

		debug.log('Destroying session:', session_id);

		var sql = 'DELETE FROM ?? WHERE ?? = ? LIMIT 1';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.session_id,
			session_id
		];

		var rows = await this.connection.query(sql, params);
        cb && cb();
	};

	MySQLStore.prototype.length = async function(cb) {

		debug.log('Getting number of sessions');

		var sql = 'SELECT COUNT(*) FROM ??';

		var params = [
			this.options.schema.tableName
		];

		var rows = await this.connection.query(sql, params);
        var count = rows[0] ? rows[0]['COUNT(*)'] : 0;
        cb(null, count);
	};

	MySQLStore.prototype.clear = async function(cb) {

		debug.log('Clearing all sessions');

		var sql = 'DELETE FROM ??';

		var params = [
			this.options.schema.tableName
		];

		var rows = await this.connection.query(sql, params);
        cb && cb();
	};

	MySQLStore.prototype.clearExpiredSessions = async function(cb) {

		debug.log('Clearing expired sessions');

		var sql = 'DELETE FROM ?? WHERE ?? < ?';

		var params = [
			this.options.schema.tableName,
			this.options.schema.columnNames.expires,
			Math.round(Date.now() / 1000)
		];

		var rows = await this.connection.query(sql, params);
        cb && cb();
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

		if (this.connection && this.options.endConnectionOnClose) {
			this.connection.end(cb);
		} else {
			cb && cb(null);
		}
	};

	MySQLStore.prototype.closeStore = deprecate.function(
		MySQLStore.prototype.close,
		'The closeStore() method has been deprecated. Use close() instead.'
	);

	MySQLStore.prototype.sync = deprecate.function(
		MySQLStore.prototype.createDatabaseTable,
		'The sync() method has been deprecated. Use createDatabaseTable() instead.'
	);

	MySQLStore.prototype.defaults = deprecate.function(
		function defaults(object, defaultValues, options) {

			object = _.clone(object);

			if (!_.isObject(object)) {
				return object;
			}

			options = options || {};

			_.each(defaultValues, function(value, key) {

				if (_.isUndefined(object[key])) {
					object[key] = value;
				}

				if (options.recursive) {
					object[key] = defaults(object[key], value, options);
				}
			});

			return object;
		},
		'The defaults() method has been deprecated and will be removed in a future version.'
	);

	MySQLStore.prototype.clone = deprecate.function(
		_.clone,
		'The clone() method has been deprecated and will be removed in a future version.'
	);

	MySQLStore.prototype.isObject = deprecate.function(
		_.isObject,
		'The isObject() method has been deprecated and will be removed in a future version.'
	);

	MySQLStore.prototype.setDefaultOptions = deprecate.function(
		_.noop,
		'The setDefaultOptions() method has been deprecated and will be removed in a future version.'
	);

	if (constructorArgs) {
		// For backwards compatibility.
		// Immediately call as a constructor.
		return new (MySQLStore.bind.apply(MySQLStore, [undefined/* context */].concat(constructorArgs)))();
	}

	return MySQLStore;
};
