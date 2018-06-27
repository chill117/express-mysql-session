'use strict';

var _ = require('underscore');

var manager = require('../manager');
var config = manager.config;
var MySQLStore = manager.MySQLStore;

describe('constructor options', function() {

	var sessionStore;
	afterEach(function() {
		if (sessionStore) {
			sessionStore.close();
		}
	});

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

			sessionStore = new MySQLStore({
				host: config.host,
				port: config.port,
				user: config.user,
				password: config.password,
				database: config.database,
				checkExpirationInterval: 1,
				clearExpired: true
			});

			done = _.once(done);

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {
				done();
			};
		});
	});

	describe('clearExpired set to FALSE', function() {

		it('should not call clearExpiredSessions', function(done) {

			sessionStore = new MySQLStore({
				host: config.host,
				port: config.port,
				user: config.user,
				password: config.password,
				database: config.database,
				checkExpirationInterval: 1,
				clearExpired: false
			});

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
