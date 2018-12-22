'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('destroy(session_id, cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when the session exists', function() {

		before(manager.populateSessions);

		it('should delete the session', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {
				var session_id = fixture.session_id;
				manager.sessionStore.destroy(session_id, function(error) {
					expect(error).to.be.undefined;
					manager.sessionStore.get(session_id, function(error, session) {
						if (error) return nextFixture(error);
						expect(session).to.equal(null);
						nextFixture();
					});
				});
			}, done);
		});
	});

	describe('when the session does not exist', function() {

		before(manager.clearSessions);

		it('should do nothing', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {
				var session_id = fixture.session_id;
				manager.sessionStore.destroy(session_id, function(error) {
					expect(error).to.be.undefined;
					nextFixture();
				});
			}, done);
		});
	});
});
