'use strict';

var _ = require('underscore');
var expect = require('chai').expect;
var mysql = require('mysql');
var session = require('express-session');

var manager = require('../manager');

describe('constructor', function() {

	var sessionStore;
	afterEach(function() {
		if (sessionStore) {
			sessionStore.close();
		}
	});

	describe('usage', function() {

		beforeEach(manager.setUp);

		beforeEach(function() {

			if (require.cache[require.resolve('../..')]) {
				delete require.cache[require.resolve('../..')];
			}

			manager.MySQLStore = null;
		});

		afterEach(function() {
			manager.MySQLStore = require('../../');
		});

		afterEach(manager.tearDown);

		describe('require(\'express-mysql-session\')(session)', function() {

			var MySQLStore;
			beforeEach(function() {
				MySQLStore = require('../..')(session);
			});

			it('MySQLStore(options, cb)', function(done) {

				var options = manager.config;
				sessionStore = new MySQLStore(options, function(error) {
					try {
						expect(error).to.be.undefined;
						expect(sessionStore.connection).to.not.be.undefined;
					} catch (error) {
						return done(error);
					}
					done();
				});
			});

			it('MySQLStore(options, connection, cb)', function(done) {

				var options = {};
				var connection = mysql.createPool(manager.config);
				sessionStore = new MySQLStore(options, connection, function(error) {
					try {
						expect(error).to.be.undefined;
						expect(sessionStore.connection).to.deep.equal(connection);
					} catch (error) {
						return done(error);
					}
					done();
				});
			});
		});

		describe('require(\'express-mysql-session\')', function() {

			var MySQLStore;
			beforeEach(function() {
				MySQLStore = require('../..');
			});

			it('MySQLStore(options, cb)', function(done) {

				var options = manager.config;
				sessionStore = new MySQLStore(options, function(error) {
					try {
						expect(error).to.be.undefined;
						expect(sessionStore.connection).to.not.be.undefined;
					} catch (error) {
						return done(error);
					}
					done();
				});
			});

			it('MySQLStore(options, connection, cb)', function(done) {

				var options = {};
				var connection = mysql.createPool(manager.config);
				sessionStore = new MySQLStore(options, connection, function(error) {
					try {
						expect(error).to.be.undefined;
						expect(sessionStore.connection).to.deep.equal(connection);
					} catch (error) {
						return done(error);
					}
					done();
				});
			});
		});
	});

	describe('options', function() {

		before(manager.setUp);

		var MySQLStore;
		before(function() {
			MySQLStore = require('../..')(session);
		});

		after(manager.tearDown);

		describe('clearExpired', function() {

			describe('TRUE', function() {

				it('should call clearExpiredSessions', function(done) {

					var options = _.extend({}, manager.config, {
						checkExpirationInterval: 1,
						clearExpired: true,
					});

					sessionStore = new MySQLStore(options);
					done = _.once(done);

					// Override the clearExpiredSessions method.
					sessionStore.clearExpiredSessions = function() {
						done();
					};
				});
			});

			describe('FALSE', function() {

				it('should not call clearExpiredSessions', function(done) {

					var options = _.extend({}, manager.config, {
						checkExpirationInterval: 1,
						clearExpired: false,
					});

					sessionStore = new MySQLStore(options);
					done = _.once(done);

					// Override the clearExpiredSessions method.
					sessionStore.clearExpiredSessions = function() {
						done(new Error('clearExpiredSessions method should NOT have been called'));
					};

					setTimeout(function() {
						done();
					}, 30);
				});
			});
		});

		describe('schema', function() {

			it('should throw an error when defining unknown column(s)', function() {

				var options = _.extend({
					schema: {
						columnNames: {
							unknownColumn: 'custom_column_name',
						},
					},
				}, manager.config);

				var thrownError;
				try {
					new MySQLStore(options);
				} catch (error) {
					thrownError = error;
				}
				expect(thrownError).to.not.be.undefined;
				expect(thrownError.message).to.equal('Unknwon column specified ("unknownColumn"). Only the following columns are configurable: "session_id", "expires", "data". Please review the documentation to understand how to correctly use this option.');
			});
		});
	});
});
