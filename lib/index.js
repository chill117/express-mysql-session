'use strict';

var oracledb = require('oracledb');
var debug_log = require('debug')('express-oracle-session:log');
var debug_error = require('debug')('express-oracle-session:error');
var deprecate = require('depd')('express-oracle-session');
var util = require('util');

var defaultOptions = {
	checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
	expiration: 86400000,// The maximum age of a valid session; milliseconds.
	createDatabaseTable: true,// Whether or not to create the sessions database table, if one does not already exist.
	schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'attributes'
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

	var oracleDbStore = function(options, connection, cb) {
		var _this= this;

		debug_log('Creating session store');

		this.options = this.clone(options || {});
		this.setDefaultOptions();

		if (this.options.debug) {
			deprecate('The \'debug\' option has been removed. This module now uses the debug module to output logs and error messages. Run your app with `DEBUG=express-oracle-session* node your-app.js` to have all logs and errors outputted to the console.');
		}

		if (typeof connection === 'function') {
			cb = connection;
			connection = undefined;
		}

		var done = function() {

			this.setExpirationInterval();

			if (cb) {
				cb.apply(undefined, arguments);
			}

		}.bind(this);

		var createDatabaseTable =  function(){
			if (!_this.options.createDatabaseTable) {
				setTimeout(done, 0);
				return;
			}

			_this.createDatabaseTable(done);
		};

		this.connection = connection;
		if (this.connection === undefined){
			oracledb.createPool(
			_this.options,
			  function(err) {
			    if (err) {
			      console.error("createPool() error: " + err.message);
			      return;
			    }
				oracledb.getConnection(  // gets a connection from the 'default' connection pool
			function(err, conn){
				if (err) {
					console.error(err.message);
					return;
				}
				_this.connection = conn;
				createDatabaseTable();
			});
			});
		} else {
			createDatabaseTable();
		}

	};

	util.inherits(oracleDbStore, Store);

	oracleDbStore.prototype.setDefaultOptions = function() {

		debug_log('Setting default options');

		this.options = this.defaults(this.options, defaultOptions, { recursive: true });
	};

	oracleDbStore.prototype.createDatabaseTable = function(cb) {

		debug_log('Creating sessions database table');

		var fs = require('fs');

		fs.readFile(__dirname + '/../schema.sql', 'utf-8', function(error, sql) {

			if (error) {
				return cb && cb(error);
			}

		/*	var params = {
				sessions: this.options.schema.tableName,
				sessionid: this.options.schema.columnNames.session_id,
				expires: this.options.schema.columnNames.expires,
				data: this.options.schema.columnNames.data
			};*/

			this.connection.execute(sql, function(error) {

				if (error) {
					//console.log(error.message)
					if(error.message.substring(0,9) === 'ORA-00955'){
						cb();
						return cb;
					}
					debug_error('Failed to create sessions database table.');
					debug_error(error);
					return cb && cb(error);
				}

				cb && cb();
			});

		}.bind(this));
	};

	oracleDbStore.prototype.get = function(session_id, cb) {

		debug_log('Getting session: ' + session_id);

		var sql = `SELECT ${this.options.schema.columnNames.data} AS data FROM ${this.options.schema.tableName} WHERE ${this.options.schema.columnNames.session_id} = :sessionid AND ROWNUM = 1`;

		var params = {
			sessionid: session_id
		};

		this.connection.execute(sql, params, { fetchInfo: { "DATA": { type: oracledb.STRING} } }, // Fetch as a String instead of a Stream
		function(error, result) {

			if (error) {
				debug_error('Failed to get session.');
				debug_error(error);
				return cb(error, null);
			}

			try {
				//debug_log('Session result: ' + result.rows[0]);
				var session = result.rows[0] !== undefined ? JSON.parse(result.rows[0][0]) : null;
				//debug_log('Session return: ' + session);

			} catch (error) {
				debug_error(error);
				return cb(new Error('Failed to parse data for session: ' + session_id));
			}

			cb(null, session);
		});
	};

	oracleDbStore.prototype.set = function(session_id, data, cb) {

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

		var sql = `MERGE INTO sessions trg
USING (SELECT :sessionid as ${this.options.schema.columnNames.session_id} FROM DUAL) src
ON (trg.${this.options.schema.columnNames.session_id} = src.${this.options.schema.columnNames.session_id})
WHEN MATCHED THEN UPDATE
SET trg.${this.options.schema.columnNames.expires} = :expires,
trg.${this.options.schema.columnNames.data} = :attributes
WHEN NOT MATCHED THEN INSERT (${this.options.schema.columnNames.session_id}, ${this.options.schema.columnNames.expires}, ${this.options.schema.columnNames.data})
VALUES (:sessionid,:expires,:attributes)`
		var params = {
			sessionid: session_id,
			expires: expires,
			attributes: data
		};
		this.connection.execute(sql, params, function(error) {

			if (error) {
				debug_error('Failed to insert session data.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	oracleDbStore.prototype.touch = function(session_id, data, cb) {

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

		var sql = `UPDATE sessions SET ${this.options.schema.columnNames.expires} = ? WHERE${this.options.schema.columnNames.session_id} = :sessionid`;

		var params = {
			expires: expires,
			sessionid: session_id
		};

		this.connection.execute(sql, params, function(error) {

			if (error) {
				debug_error('Failed to touch session.');
				debug_error(error);
				return cb && cb(error);
			}

			return cb && cb();
		});
	};

	oracleDbStore.prototype.destroy = function(session_id, cb) {

		debug_log('Destroying session: ' + session_id);

		var sql = `DELETE FROM ${this.options.schema.tableName} WHERE ${this.options.schema.columnNames.session_id} = :sessionid`;

		var params = {
			sessionid: session_id
		};

		this.connection.execute(sql, params, function(error) {

			if (error) {
				debug_error('Failed to destroy session.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	oracleDbStore.prototype.length = function(cb) {

		debug_log('Getting number of sessions');

		var sql = `SELECT COUNT(*) FROM ${this.options.schema.tableName}`;

		this.connection.execute(sql, function(error, rows) {

			if (error) {
				debug_error('Failed to get number of sessions.');
				debug_error(error);
				return cb && cb(error);
			}

			var count = rows[0] ? rows[0]['COUNT(*)'] : 0;

			cb(null, count);
		});
	};

	oracleDbStore.prototype.clear = function(cb) {

		debug_log('Clearing all sessions');

		var sql = `DELETE FROM ${this.options.schema.tableName}`;


		this.connection.execute(sql, function(error) {

			if (error) {
				debug_error('Failed to clear all sessions.');
				debug_error(error);
				return cb && cb(error);
			}

			cb && cb();
		});
	};

	oracleDbStore.prototype.clearExpiredSessions = function(cb) {

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

	oracleDbStore.prototype.setExpirationInterval = function(interval) {

		interval || (interval = this.options.checkExpirationInterval);

		debug_log('Setting expiration interval: ' + interval + 'ms');

		this.clearExpirationInterval();
		this._expirationInterval = setInterval(this.clearExpiredSessions.bind(this), interval);
	};

	oracleDbStore.prototype.clearExpirationInterval = function() {

		debug_log('Clearing expiration interval');

		clearInterval(this._expirationInterval);
		this._expirationInterval = null;
	};

	oracleDbStore.prototype.close = function(cb) {

		debug_log('Closing session store');

		this.clearExpirationInterval();

		if (this.connection) {
			this.connection.close(cb);
		} else {
			cb && cb(null);
		}
	};

	oracleDbStore.prototype.defaults = function(object, defaultValues, options) {

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

	oracleDbStore.prototype.clone = function(object) {

		return JSON.parse(JSON.stringify(object));
	}

	oracleDbStore.prototype.isObject = function(value) {

		var type = typeof value;
		return type === 'function' || type === 'object' && !!value;
	}

	if (constructorArgs) {
		// For backwards compatibility.
		// Immediately call as a constructor.
		return new (oracleDbStore.bind.apply(oracleDbStore, [undefined/* context */].concat(constructorArgs)))();
	}

	return oracleDbStore;
};
