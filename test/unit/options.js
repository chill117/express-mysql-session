'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var config = manager.config;
var MySQLStore = manager.MySQLStore;

describe('constructor options', function() {

	before(function(done) {

		manager.setUp(function(error, store) {

			if (error) {
				return done(error);
			}

			done();
		});
	});

	after(manager.tearDown);

	describe('clearExpired set to TRUE', function() {

		it('should call clearExpiredSessions', function(done) {
			var checkExpirationInterval = 45;

			var sessionStore = new MySQLStore({
				host: config.host,
				port: config.port,
				user: config.user,
				password: config.password,
				database: config.database,
				checkExpirationInterval: checkExpirationInterval,
				clearExpired: true
			});

			var called = false;

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {
				called = true;
			};

			setTimeout(function() {
				expect(called).to.equal(true);
				done();
			}, checkExpirationInterval + 40);
		});
	});

	describe('clearExpired set to FALSE', function() {

		it('should not call clearExpiredSessions', function(done) {
			var checkExpirationInterval = 45;

			var sessionStore = new MySQLStore({
				host: config.host,
				port: config.port,
				user: config.user,
				password: config.password,
				database: config.database,
				checkExpirationInterval: checkExpirationInterval,
				clearExpired: false
			});

			var called = false;

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {
				called = true;
			};

			setTimeout(function() {
				expect(called).to.equal(false);
				done();
			}, checkExpirationInterval + 40);
		});
	});
});
