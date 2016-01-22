'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;
var sessionStore = manager.sessionStore;

describe('SessionStore#get(session_id, cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when a session exists', function() {

		before(manager.populateSessions);

		it('should return its session data', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null);
					expect(JSON.stringify(session)).to.equal(JSON.stringify(data));

					nextFixture();
				});

			}, done);
		});
	});

	describe('when a session does not exist', function() {

		before(manager.clearSessions);

		it('should return null', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null);
					expect(session).to.equal(null);

					nextFixture();
				});

			}, done);
		});
	});
});
