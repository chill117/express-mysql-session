'use strict';

var async = require('async');
var expect = require('chai').expect;

var manager = require('../manager');
var fixtures = manager.fixtures.sessions;

describe('set(session_id, data, cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when the session does not exist yet', function() {

		after(manager.clearSessions);

		it('should create a new session', function(done) {
			async.each(fixtures, function(fixture, nextFixture) {
				var session_id = fixture.session_id;
				var data = fixture.data;
				manager.sessionStore.set(session_id, data, function(error) {
					expect(error).to.be.undefined;
					manager.sessionStore.get(session_id, function(error, session) {
						if (error) return nextFixture(error);
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
				// Clone the fixture data.
				var data = JSON.parse(JSON.stringify(fixture.data));
				data.new_attr = 'A new attribute!';
				data.and_another = 'And another attribute..';
				data.some_date = (new Date()).toString();
				data.an_int_attr = 55;
				manager.sessionStore.set(session_id, data, function(error) {
					expect(error).to.be.undefined;
					manager.sessionStore.get(session_id, function(error, session) {
						if (error) return nextFixture(error);
						expect(error).to.equal(null);
						expect(JSON.stringify(session)).to.equal(JSON.stringify(data));
						nextFixture();
					});
				});
			}, done);
		});
	});

	it('should be able to handle emojis and other utf8 characters in session data', function(done) {
		var session_id = 'some-session-id';
		var data = {};
		data.text_with_emoji = 'Here is an emoji: 😆.';
		data.and_more = 'And another one (😉)..'
		manager.sessionStore.set(session_id, data, function(error) {
			expect(error).to.be.undefined;
			manager.sessionStore.get(session_id, function(error, session) {
				expect(error).to.equal(null);
				expect(session).to.deep.equal(data);
				done();
			});
		});
	});

	it('can store more than 64 KB of data per session', function(done) {
		var session_id = 'test-max-data';
		var data = {};
		data.lotsOfData = manager.fixtures.junkData['200KB'];
		manager.sessionStore.set(session_id, data, function(error) {
			expect(error).to.be.undefined;
			manager.sessionStore.get(session_id, function(error, session) {
				expect(error).to.equal(null);
				expect(session).to.deep.equal(data);
				done();
			});
		});
	});
});
