'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('set(session_id, data, cb)', function() {

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

	describe('when the session does not exist yet', function() {

		after(manager.clearSessions);

		it('should create a new session', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = fixture.data;

				sessionStore.set(session_id, data, function(error) {

					expect(error).to.equal(undefined);

					sessionStore.get(session_id, function(error, session) {

						if (error) {
							return nextFixture(error);
						}

						expect(error).to.equal(null);
						expect(JSON.stringify(session)).to.equal(JSON.stringify(data));

						nextFixture();
					});
				});

			}, done);
		});
	});

	describe('when the session already exists', function() {

		before(manager.populateSessions);

		it('should update the existing session with the new data', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id;
				var data = {};

				for (var key in fixture.data) {
					data[key] = fixture.data[key];
				}

				data.new_attr = 'A new attribute!';
				data.and_another = 'And another attribute..';
				data.some_date = (new Date()).toString();
				data.an_int_attr = 55;

				sessionStore.set(session_id, data, function(error) {

					expect(error).to.equal(undefined);

					sessionStore.get(session_id, function(error, session) {

						if (error) {
							return nextFixture(error);
						}

						expect(error).to.equal(null);
						expect(JSON.stringify(session)).to.equal(JSON.stringify(data));

						nextFixture();
					});
				});

			}, done);
		});
	});
});
