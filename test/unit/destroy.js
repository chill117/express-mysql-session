'use strict';

var async = require('async');
var expect = require('chai').expect;

var sessionStore = require('../session-store');
var TestManager = require('../test-manager');

describe('SessionStore#destroy(session_id, cb)', function() {

	before(TestManager.tearDown);
	before(TestManager.setUp);
	after(TestManager.tearDown);

	var fixtures = require('../fixtures/sessions');

	describe('when the session exists', function() {

		before(TestManager.populateSessions);

		it('should delete the session', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.destroy(session_id, function(error) {

					expect(error).to.equal(undefined);

					sessionStore.get(session_id, function(error, session) {

						if (error) {
							return nextFixture(new Error(error));
						}

						expect(session).to.equal(null);

						nextFixture();
					});
				});

			}, done);

		});
	});

	describe('when the session does not exist', function() {

		before(TestManager.clearSessions);

		it('should do nothing', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.destroy(session_id, function(error) {

					expect(error).to.equal(undefined);

					nextFixture();
				});

			}, done);

		});
	});
});
