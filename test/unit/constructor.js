const assert = require('assert');
const session = require('express-session');
const manager = require('../manager');
const MySQLStore = require('../..')(session);

describe('constructor', function() {

	let sessionStore;
	afterEach(function() {
		if (sessionStore) return sessionStore.close();
	});

	it('MySQLStore(options)', function() {
		sessionStore = manager.createInstance();
		return sessionStore.onReady().then(() => {
			assert.notStrictEqual(typeof sessionStore.connection, 'undefined');
		});
	});

	it('MySQLStore(options, connection)', function() {
		const connection = MySQLStore.prototype.createPool(manager.config);
		sessionStore = manager.createInstance({}, connection);
		return sessionStore.onReady().then(() => {
			assert.deepStrictEqual(sessionStore.connection, connection);
		});
	});

	it('mysql2 callback interface', function() {
		const mysql = require('mysql2');
		const options = MySQLStore.prototype.prepareOptionsForMySQL2(manager.config);
		const connection = mysql.createPool(options);
		sessionStore = manager.createInstance({}, connection);
		return sessionStore.onReady().then(() => {
			assert.deepStrictEqual(sessionStore.connection, connection);
			return sessionStore.length();
		});
	});

	describe('options', function() {

		describe('clearExpired', function() {

			describe('TRUE', function() {

				it('should call clearExpiredSessions', function() {
					return new Promise((resolve, reject) => {
						try {
							sessionStore = manager.createInstance({
								checkExpirationInterval: 1,
								clearExpired: true,
							});
							// Override the clearExpiredSessions method.
							sessionStore.clearExpiredSessions = function() {
								resolve();
							};
						} catch (error) {
							return reject(error);
						}
					});
				});
			});

			describe('FALSE', function() {

				it('should not call clearExpiredSessions', function() {
					return new Promise((resolve, reject) => {
						try {
							sessionStore = manager.createInstance({
								checkExpirationInterval: 1,
								clearExpired: false,
							});
							// Override the clearExpiredSessions method.
							sessionStore.clearExpiredSessions = function() {
								reject(new Error('Should not have called clearExpiredSessions'));
							};
							setTimeout(resolve, 30);
						} catch (error) {
							return reject(error);
						}
					});
				});
			});
		});

		describe('schema', function() {

			it('should throw an error when defining unknown column(s)', function() {
				const options = {
					schema: {
						columnNames: {
							unknownColumn: 'custom_column_name',
						},
					},
				};
				let thrownError;
				try { manager.createInstance(options); } catch (error) {
					thrownError = error;
				}
				assert.notStrictEqual(typeof thrownError, 'undefined');
				assert.strictEqual(thrownError.message, 'Unknown column specified ("unknownColumn"). Only the following columns are configurable: "session_id", "expires", "data". Please review the documentation to understand how to correctly use this option.');
			});
		});
	});
});
