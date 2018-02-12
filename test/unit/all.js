'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('all(cb)', function() {

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

	describe('when sessions exist', function() {

		beforeEach(manager.populateSessions);

		it('should get all sessions', function(done) {

			sessionStore.all(function(error, sessions) {

				try {
					expect(error).to.equal(null);
					expect(sessions).to.be.an('array');
					expect(sessions.length).to.equal(fixtures.length);
					_.each(sessions, function(session) {
						expect(session).to.be.an('object');
						var sessionDataStr = JSON.stringify(session);
						var found = !!_.find(fixtures, function(fixture) {
							return JSON.stringify(fixture.data) === sessionDataStr;
						});
						expect(found).to.equal(true);
					});
				} catch (error) {
					return done(error);
				}

				done();
			});
		});
	});
});
