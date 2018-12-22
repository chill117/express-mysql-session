'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');

describe('get(session_id, cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when a session exists', function() {

		var session_id;
		var data;
		beforeEach(function(done) {
			var fixture = _.first(manager.fixtures.sessions);
			session_id = fixture.session_id;
			data = fixture.data;
			manager.populateSession(fixture, done);
		});

		describe('and is not expired', function() {

			it('should return its session data', function(done) {
				manager.sessionStore.get(session_id, function(error, session) {
					if (error) return done(error);
					expect(JSON.stringify(session)).to.equal(JSON.stringify(data));
					done();
				});
			});
		});

		describe('and is expired', function() {

			beforeEach(function(done) {
				manager.expireSession(session_id, done);
			});

			it('should return NULL', function(done) {
				manager.sessionStore.get(session_id, function(error, session) {
					if (error) return done(error);
					expect(session).to.equal(null);
					done();
				});
			});
		});
	});

	describe('when a session does not exist', function() {

		beforeEach(manager.clearSessions);

		it('should return NULL', function(done) {

			var fixture = _.first(manager.fixtures.sessions);
			var session_id = fixture.session_id;
			manager.sessionStore.get(session_id, function(error, session) {
				if (error) return done(error);
				expect(session).to.equal(null);
				done();
			});
		});
	});
});
