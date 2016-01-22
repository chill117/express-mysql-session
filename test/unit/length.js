'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;
var sessionStore = manager.sessionStore;

describe('SessionStore#length(cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('should give an accurate count of the total number of sessions', function(done) {

		var num_sessions = 0;

		async.eachSeries(fixtures, function(fixture, nextFixture) {

			var session_id = fixture.session_id;
			var data = fixture.data;

			sessionStore.set(session_id, data, function(error) {

				if (error) {
					return nextFixture(error);
				}

				num_sessions++;

				sessionStore.length(function(error, count) {

					expect(error).to.equal(null);
					expect(count).to.equal(num_sessions);

					nextFixture();
				});
			});

		}, done);
	});
});
