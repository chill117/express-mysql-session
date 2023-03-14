const assert = require('assert');
const manager = require('../manager');
const MySQLStore = manager.MySQLStore;

describe('close()', function() {

	it('callback', function(done) {
		const sessionStore = manager.createInstance();
		sessionStore.onReady().then(() => {
			sessionStore.close(done);
		}).catch(done);
	});

	describe('database connection created internally', function() {

		describe('default options', function() {

			let sessionStore;
			beforeEach(function() {
				sessionStore = manager.createInstance();
				return sessionStore.onReady();
			});

			it('should close the store and end the database connection', function() {
				return sessionStore.close().then(() => {
					assert.strictEqual(sessionStore._expirationInterval, null);
					return sessionStore.connection.query('SHOW TABLES').then(() => {
						throw new Error('Expected an error due to closed database connection.');
					}).catch(error => {
						assert.ok(error instanceof Error);
						assert.strictEqual(error.message, 'Pool is closed.');
					});
				});
			});
		});

		describe('option.endConnectionOnClose set to FALSE', function() {

			let sessionStore;
			beforeEach(function() {
				sessionStore = manager.createInstance({
					endConnectionOnClose: false,
				});
				return sessionStore.onReady();
			});

			afterEach(function() {
				return sessionStore.connection.end();
			});

			it('should close the store but not end the database connection', function() {
				return sessionStore.close().then(() => {
					assert.strictEqual(sessionStore._expirationInterval, null);
					return sessionStore.connection.query('SHOW TABLES');
				});
			});
		});
	});

	describe('database connection provided to constructor', function() {

		describe('default options', function() {

			let sessionStore;
			beforeEach(function() {
				const connection = MySQLStore.prototype.createPool(manager.config);
				sessionStore = manager.createInstance({}, connection);
				return sessionStore.onReady();
			});

			afterEach(function() {
				return sessionStore.connection.end();
			});

			it('should close the store but not end the database connection', function() {
				return sessionStore.close().then(() => {
					assert.strictEqual(sessionStore._expirationInterval, null);
					return sessionStore.connection.query('SHOW TABLES');
				});
			});
		});

		describe('option.endConnectionOnClose set to TRUE', function() {

			let sessionStore;
			beforeEach(function() {
				sessionStore = manager.createInstance({
					endConnectionOnClose: true,
				});
				return sessionStore.onReady();
			});

			it('should close the store and end the database connection', function() {
				return sessionStore.close().then(() => {
					assert.strictEqual(sessionStore._expirationInterval, null);
					return sessionStore.connection.query('SHOW TABLES').then(() => {
						throw new Error('Expected an error due to closed database connection.');
					}).catch(error => {
						assert.ok(error instanceof Error);
						assert.strictEqual(error.message, 'Pool is closed.');
					});
				});
			});
		});
	});
});
