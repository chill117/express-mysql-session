'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('touch(session_id, data, cb)', function() {

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

	after(manager.tearDown);

	describe('when the session does not exist', function() {

		after(manager.clearSessions);

		it('should not create new session', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.touch(session_id, data, function(error) {

					expect(error).to.equal(undefined);

					sessionStore.get(session_id, function(error, session) {

						if (error) {
							return nextFixture(error);
						}

						expect(error).to.equal(null);
						expect(session).to.equal(null);

						nextFixture();
					});
				});

			}, done);
		});
	});

	describe('when the session exists', function() {

		var oldExpiresValue = Math.round((Date.now() / 1000)) - 10;

		before(function(done) {

			manager.populateSessions(function() {

				var sql = 'UPDATE `sessions` SET `expires` = :oldExpiresValue';
				var params = [oldExpiresValue];

				sessionStore.connection.execute(sql, params, done);
			});
		});

		it('"expires" field should be updated, other fields should not be updated', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;

				sessionStore.touch(session_id, fixture.data, function(error) {

					expect(error).to.equal(undefined);

					var sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions` WHERE `session_id` = :sessid';

					var params = [
						fixture.session_id
					];

					sessionStore.connection.execute(sql, params, function(error, data) {

						var touchedSession = data[0];

						expect(touchedSession.session_id).to.equal(fixture.session_id);
						expect(touchedSession.data).to.equal(JSON.stringify(fixture.data));
						expect(touchedSession.expires).to.above(oldExpiresValue);

						nextFixture();
					});
				});

			}, done);
		});
	});
});
