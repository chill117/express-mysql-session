'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('clearExpiredSessions(cb)', function() {

	before(manager.setUp);
	before(manager.populateSessions);

	var numExpired = fixtures.length - 2;
	before(function(done) {
		manager.expireSomeSessions(numExpired, done);
	});

	after(manager.tearDown);

	it('should clear expired sessions', function(done) {
		manager.sessionStore.clearExpiredSessions(function(error) {
			if (error) return done(error);
			manager.sessionStore.length(function(error, count) {
				if (error) return done(error);
				expect(count).to.equal(fixtures.length - numExpired);
				done();
			});
		});
	});
});
