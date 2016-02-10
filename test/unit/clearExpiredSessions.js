'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;
var sessionStore = manager.sessionStore;

describe('clearExpiredSessions(cb)', function() {

	var numExpired = fixtures.length - 2;

	before(manager.setUp);

	before(manager.populateSessions);

	before(function(done) {

		// Change some of the sessions' expires time.

		var expiration = sessionStore.options.expiration;
		var sql = 'UPDATE `sessions` SET expires = ? LIMIT ' + numExpired;
		var expires = ( new Date( Date.now() - (expiration + 15000) ) ) / 1000;
		var params = [ expires ];

		sessionStore.connection.query(sql, params, done);
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
