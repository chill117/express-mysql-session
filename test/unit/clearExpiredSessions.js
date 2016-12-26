'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('clearExpiredSessions(cb)', function() {

	var sessionStore;

	before(function(done) {

		manager.setUp(function(error, store) {

			if (error) {
				return done(error);
			}

			sessionStore = store;
			done();
		});
	});

	before(manager.populateSessions);

	var numExpired = fixtures.length - 2;

	before(function(done) {

		// Change some of the sessions' expires time.

		var expiration = sessionStore.options.expiration;
		var sql = 'UPDATE `sessions` SET expires = :expires LIMIT ' + numExpired;
		var expires = ( new Date( Date.now() - (expiration + 15000) ) ) / 1000;
		var params = [ expires ];

		sessionStore.connection.execute(sql, params, done);
	});

	after(manager.tearDown);

	it('should clear expired sessions', function(done) {

		sessionStore.clearExpiredSessions(function(error) {

			if (error) {
				return done(error);
			}

			sessionStore.length(function(error, count) {

				if (error) {
					return done(error);
				}

				expect(count).to.equal(fixtures.length - numExpired);
				done();
			});
		});
	});
});
