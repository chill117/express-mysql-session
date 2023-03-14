const assert = require('assert');
const mysql = require('mysql2/promise');
const path = require('path');
const util = require('util');

const debug = {
	log: require('debug')('express-mysql-session:log'),
	error: require('debug')('express-mysql-session:error')
};

const noop = function() {};

module.exports = function(session) {

	const Store = session.Store;

	let MySQLStore = function(options, connection) {
		debug.log('Creating session store');
		this.state = 'INITIALIZING';
		this.connection = connection;
		this.setOptions(options);
		if (!this.connection) {
			this.connection = this.createPool(this.options);
		}
		this.onReadyPromises = [];
		Promise.resolve().then(() => {
			if (this.options.createDatabaseTable) {
				return this.createDatabaseTable();
			}
		}).then(() => {
			this.state = 'INITIALIZED';
			if (this.options.clearExpired) {
				this.setExpirationInterval();
			}
		}).then(() => {
			this.resolveReadyPromises();
		}).catch(error => {
			this.rejectReadyPromises(error);
		});
	};

	util.inherits(MySQLStore, Store);

	MySQLStore.prototype.state = 'UNINITIALIZED';

	MySQLStore.prototype.defaultOptions = {
		// Whether or not to automatically check for and clear expired sessions:
		clearExpired: true,
		// How frequently expired sessions will be cleared; milliseconds:
		checkExpirationInterval: 900000,
		// The maximum age of a valid session; milliseconds:
		expiration: 86400000,
		// Whether or not to create the sessions database table, if one does not already exist:
		createDatabaseTable: true,
		// Whether or not to end the database connection when the store is closed:
		endConnectionOnClose: true,
		// Whether or not to disable touch:
		disableTouch: false,
		charset: 'utf8mb4_bin',
		schema: {
			tableName: 'sessions',
			columnNames: {
				session_id: 'session_id',
				expires: 'expires',
				data: 'data',
			},
		},
	};

	MySQLStore.prototype.onReady = function() {
		if (this.state === 'INITIALIZED') return Promise.resolve();
		return new Promise((resolve, reject) => {
			this.onReadyPromises.push({ resolve, reject });
		});
	};

	MySQLStore.prototype.resolveReadyPromises = function() {
		this.onReadyPromises.forEach(promise => promise.resolve());
		this.onReadyPromises = [];
	};

	MySQLStore.prototype.rejectReadyPromises = function(error) {
		assert.ok(error instanceof Error);
		this.onReadyPromises.forEach(promise => promise.reject(error));
		this.onReadyPromises = [];
	};

	MySQLStore.prototype.prepareOptionsForMySQL2 = function(options) {
		let mysqlOptions = {};
		[
			'host',
			'port',
			'user',
			'password',
			'database',
			'waitForConnections',
			'connectionLimit',
			'maxIdle',
			'idleTimeout',
			'queueLimit',
		].forEach(key => {
			if (typeof options[key] !== 'undefined') {
				mysqlOptions[key] = options[key];
			}
		});
		return mysqlOptions;
	};

	MySQLStore.prototype.createPool = function(options) {
		const mysqlOptions = this.prepareOptionsForMySQL2(options);
		return mysql.createPool(mysqlOptions);
	};

	MySQLStore.prototype.setOptions = function(options) {
		this.options = Object.assign({}, this.defaultOptions, {
			// The default value of this option depends on whether or not a connection was passed to the constructor.
			endConnectionOnClose: !this.connection,
		}, options || {});
		this.options.schema = Object.assign({}, this.defaultOptions.schema, this.options.schema || {});
		this.options.schema.columnNames = Object.assign({}, this.defaultOptions.schema.columnNames, this.options.schema.columnNames || {});
		this.validateOptions(this.options);
	};

	MySQLStore.prototype.validateOptions = function(options) {
		const allowedColumnNames = Object.keys(this.defaultOptions.schema.columnNames);
		Object.keys(options.schema.columnNames).forEach(function(userDefinedColumnName) {
			if (!allowedColumnNames.includes(userDefinedColumnName)) {
				throw new Error('Unknown column specified ("' + userDefinedColumnName + '"). Only the following columns are configurable: "session_id", "expires", "data". Please review the documentation to understand how to correctly use this option.');
			}
		});
	};

	MySQLStore.prototype.createDatabaseTable = function() {
		return Promise.resolve().then(() => {
			debug.log('Creating sessions database table');
			const fs = require('fs').promises;
			const schemaFilePath = path.join(__dirname, 'schema.sql');
			return fs.readFile(schemaFilePath, 'utf-8').then(sql => {
				sql = sql.replace(/`[^`]+`/g, '??');
				const params = [
					this.options.schema.tableName,
					this.options.schema.columnNames.session_id,
					this.options.schema.columnNames.expires,
					this.options.schema.columnNames.data,
					this.options.schema.columnNames.session_id,
				];
				return this.query(sql, params);
			}).then(() => {
				debug.log('Successfully created sessions database table');
			}).catch(error => {
				debug.error('Failed to create sessions database table.');
				debug.error(error);
				throw error;
			});;
		});
	};

	MySQLStore.prototype.get = function(session_id) {
		return Promise.resolve().then(() => {
			debug.log(`Getting session: ${session_id}`);
			// LIMIT not needed here because the WHERE clause is searching by the table's primary key.
			const sql = 'SELECT ?? AS data, ?? as expires FROM ?? WHERE ?? = ?';
			const params = [
				this.options.schema.columnNames.data,
				this.options.schema.columnNames.expires,
				this.options.schema.tableName,
				this.options.schema.columnNames.session_id,
				session_id,
			];
			return this.query(sql, params).then(result => {
				const [ rows ] = result;
				const row = rows[0] || null;
				if (!row) {
					return null;// not found
				}
				// Check the expires time.
				const now = Math.round(Date.now() / 1000);
				if (row.expires < now) {
					return null;// expired
				}
				let data = row.data;
				if (typeof data === 'string') {
					try { data = JSON.parse(data); } catch (error) {
						debug.error(`Failed to parse data for session (${session_id})`);
						debug.error(error);
						throw error;
					}
				}
				return data;
			}).catch(error => {
				debug.error(`Failed to get session: ${session_id}`);
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.set = function(session_id, data) {
		return Promise.resolve().then(() => {
			debug.log(`Setting session: ${session_id}`);
			let expires;
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
			const sql = 'INSERT INTO ?? (??, ??, ??) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ?? = VALUES(??), ?? = VALUES(??)';
			const params = [
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
				this.options.schema.columnNames.data,
			];
			return this.query(sql, params).catch(error => {
				debug.error('Failed to insert session data.');
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.touch = function(session_id, data) {
		return Promise.resolve().then(() => {
			if (this.options.disableTouch) return;// noop
			debug.log(`Touching session: ${session_id}`);
			let expires;
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
			const sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
			const params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.expires,
				expires,
				this.options.schema.columnNames.session_id,
				session_id,
			];
			return this.query(sql, params).catch(error => {
				debug.error(`Failed to touch session (${session_id})`);
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.destroy = function(session_id) {
		return Promise.resolve().then(() => {
			debug.log(`Destroying session: ${session_id}`);
			// LIMIT not needed here because the WHERE clause is searching by the table's primary key.
			const sql = 'DELETE FROM ?? WHERE ?? = ?';
			const params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.session_id,
				session_id,
			];
			return this.query(sql, params).catch(error => {
				debug.error(`Failed to destroy session (${session_id})`);
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.length = function() {
		return Promise.resolve().then(() => {
			debug.log('Getting number of sessions');
			const sql = 'SELECT COUNT(*) FROM ?? WHERE ?? >= ?';
			const params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.expires,
				Math.round(Date.now() / 1000),
			];
			return this.query(sql, params).then(result => {
				const [ rows ] = result;
				return rows[0] && rows[0]['COUNT(*)'] || 0;
			}).catch(error => {
				debug.error('Failed to get number of sessions.');
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.all = function() {
		return Promise.resolve().then(() => {
			debug.log('Getting all sessions');
			const sql = 'SELECT * FROM ?? WHERE ?? >= ?';
			const params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.expires,
				Math.round(Date.now() / 1000),
			];
			return this.query(sql, params).then(result => {
				const [ rows ] = result;
				let sessions = {};
				rows.forEach(function(row) {
					const session_id = row.session_id;
					let data = row.data;
					if (typeof data === 'string') {
						try { data = JSON.parse(data); } catch (error) {
							debug.error('Failed to parse data for session (' + session_id + ')');
							debug.error(error);
							return null;
						}
					}
					sessions[session_id] = data;
				});
				return sessions;
			}).catch(error => {
				debug.error('Failed to get all sessions.');
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.clear = function() {
		return Promise.resolve().then(() => {
			debug.log('Clearing all sessions');
			const sql = 'DELETE FROM ??';
			const params = [
				this.options.schema.tableName,
			];
			return this.query(sql, params).catch(error => {
				debug.error('Failed to clear all sessions.');
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.clearExpiredSessions = function() {
		return Promise.resolve().then(() => {
			debug.log('Clearing expired sessions');
			const sql = 'DELETE FROM ?? WHERE ?? < ?';
			const params = [
				this.options.schema.tableName,
				this.options.schema.columnNames.expires,
				Math.round(Date.now() / 1000),
			];
			return this.query(sql, params).catch(error => {
				debug.error('Failed to clear expired sessions.');
				debug.error(error);
				throw error;
			});
		});
	};

	MySQLStore.prototype.query = function(sql, params) {
		return new Promise((resolve, reject) => {
			let result;
			try {
				result = this.connection.query(sql, params, (error, rows, fields) => {
					if (error) return reject(error);
					resolve([ rows, fields ]);
				});
			} catch (error) {
				return reject(error);
			}
			if (result instanceof Promise) {
				result.then(resolve).catch(reject);
			}
		});
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

	MySQLStore.prototype.close = function() {
		return Promise.resolve().then(() => {
			debug.log('Closing session store');
			this.clearExpirationInterval();
			if (this.state === 'INITIALIZED' && this.connection && this.options.endConnectionOnClose) {
				this.state = 'CLOSING';
				return this.connection.end().finally(() => {
					this.state = 'CLOSED';
				});
			}
		});
	};

	// Provide support for optional callback.
	[ 'all', 'destroy', 'clear', 'length', 'get', 'set', 'touch', 'close' ].forEach(method => {
		const fn = MySQLStore.prototype[method];
		MySQLStore.prototype[method] = function() {
			let args = Array.prototype.slice.call(arguments);
			let callback;
			if (typeof args[args.length - 1] === 'function') {
				callback = args[args.length - 1];
				args = args.slice(0, -1);
			}
			let promise = fn.apply(this, args);
			if (callback) {
				promise = promise.then(result => callback(null, result)).catch(callback);
			}
			return promise;
		};
	});

	// `promiseFactories` is an array of functions that return promises. Example usage:
	// 		promiseAllSeries([1, 2, 3].map(n => {
	// 			return function() {
	// 				console.log(`starting promise ${n}`);
	// 				return new Promise((resolve, reject) => {
	// 					setTimeout(resolve, 500);
	// 				});
	// 			};
	// 		}));
	MySQLStore.promiseAllSeries = function(promiseFactories) {
		let result = Promise.resolve();
		promiseFactories.forEach(promiseFactory => {
			result = result.then(promiseFactory);
		});
		return result;
	};

	return MySQLStore;
};
