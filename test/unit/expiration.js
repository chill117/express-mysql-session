'use strict';

var expect = require('chai').expect;

var sessionStore = require('../session-store');
var TestManager = require('../test-manager');
var SessionStore = require('../../index');
var databaseConfig = require('../config/database');

describe('SessionStore#', function() {

	before(TestManager.tearDown);
	before(TestManager.setUp);
	after(TestManager.tearDown);

	describe('clearExpiredSessions(cb)', function() {

		var fixtures = require('../fixtures/sessions');
		var num_expired = fixtures.length - 2;

		before(TestManager.populateSessions);

		before(function(done) {

			// Change some of the sessions' expires time.

			var expiration = sessionStore.options.expiration;

			var sql = 'UPDATE `sessions` SET expires = ? LIMIT ' + num_expired;
			var expires = ( new Date( Date.now() - (expiration + 15000) ) ) / 1000;
			var params = [ expires ];

			sessionStore.connection.query(sql, params, function(error) {

				if (error) {
					return done(new Error(error));
				}

				done();
			});
		});

		after(TestManager.clearSessions);

		it('should clear expired sessions', function(done) {

			sessionStore.clearExpiredSessions(function(error) {

				if (error) {
					return done(new Error(error));
				}

				sessionStore.length(function(error, count) {

					if (error) {
						return done(new Error(error));
					}

					expect(count).to.equal(fixtures.length - num_expired);

					done();
				});
			});
		});
	});

	describe('setExpirationInterval(interval)', function() {

		var originalMethods = {};

		before(function() {

			originalMethods['clearExpiredSessions'] = sessionStore.clearExpiredSessions;
		});

		afterEach(function() {

			// Restore original methods on the sessionStore object.
			for (var name in originalMethods) {
				sessionStore[name] = originalMethods[name];
			}

			sessionStore.clearExpirationInterval();
		});

		it('should be called when \'createDatabaseTable\' option is set to FALSE', function(done) {

			var checkExpirationInterval = 45;

			var sessionStore = new SessionStore({
				host: databaseConfig.host,
				port: databaseConfig.port,
				user: databaseConfig.user,
				password: databaseConfig.password,
				database: databaseConfig.database,
				checkExpirationInterval: checkExpirationInterval,
				createDatabaseTable: false
			});

			var called = false;

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {

				called = true;
			};

			setTimeout(function() {

				expect(called).to.equal(true);

				done();

			}, checkExpirationInterval + 30);
		});

		it('should correctly set the check expiration interval time', function(done) {

			var numCalls = 0,
				numCallsExpected = 5,
				intervalTime = 14;

			var paddingTime = (intervalTime * 1.5);

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {

				numCalls++;
			};

			sessionStore.setExpirationInterval(intervalTime);

			// Timeouts will never execute before the time given.
			// But they are not 100% guaranteed to execute exactly when you would expect.
			setTimeout(function() {

				expect(numCalls >= numCallsExpected).to.equal(true);

				done();

			}, (intervalTime * numCallsExpected) + paddingTime);

		});
	});
});
