'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;
var oracledb = require('oracledb');

describe('touch(session_id, data, cb)', function() {
	this.timeout(30000); // A very long environment setup.

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

				var sql = 'UPDATE sessions SET expires = :oldExpiresValue';
				var params = [oldExpiresValue];

				sessionStore.connection.execute(sql, params, done);
			});
		});

		it('"expires" field should be updated, other fields should not be updated', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;

				sessionStore.touch(session_id, fixture.data, function(error) {

					expect(error).to.equal(undefined);

					var sql = 'SELECT * FROM sessions WHERE session_id = :sessid';

					var params = {
						sessid: fixture.session_id
					};

					sessionStore.connection.execute(sql, params, {fetchInfo: { "ATTRIBUTES": { type: oracledb.STRING} } }, // Fetch as a String instead of a Stream
					function(error, data) {

						var touchedSession = data.rows[0];
						//console.log('touchedSession: ' + JSON.stringify(data.rows[0]));

						expect(touchedSession[0]).to.equal(fixture.session_id);
						expect(touchedSession[2]).to.equal(JSON.stringify(fixture.data));
						expect(touchedSession[1]).to.above(oldExpiresValue);

						nextFixture();
					});
				});

			}, done);
		});
	});
});
