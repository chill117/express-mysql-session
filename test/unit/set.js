const assert = require('assert');
const manager = require('../manager');
const fixtures = manager.fixtures.sessions;

describe('set(session_id, data[, callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		const { session_id, data } = fixtures[0];
		manager.sessionStore.set(session_id, data, done);
	});

	describe('when the session does not exist yet', function() {

		after(manager.clearSessions);

		it('should create a new session', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id, data } = fixture;
				return manager.sessionStore.set(session_id, data).then(() => {
					return manager.sessionStore.get(session_id).then(session => {
						assert.deepStrictEqual(session, data);
					});
				});
			}));
		});
	});

	describe('when the session already exists', function() {

		before(manager.populateSessions);

		it('should update the existing session with the new data', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id } = fixture;
				let { data } = fixture;
				data = JSON.parse(JSON.stringify(data));// clone to prevent mutation of original
				data.new_attr = 'A new attribute!';
				data.and_another = 'And another attribute..';
				data.some_date = (new Date()).toString();
				data.an_int_attr = 55;
				return manager.sessionStore.set(session_id, data).then(() => {
					return manager.sessionStore.get(session_id).then(session => {
						assert.deepStrictEqual(session, data);
					});
				});
			}));
		});
	});

	it('should be able to handle emojis and other utf8 characters in session data', function() {
		const session_id = 'some-session-id';
		let data = {};
		data.text_with_emoji = 'Here is an emoji: 😆.';
		data.and_more = 'And another one (😉)..'
		return manager.sessionStore.set(session_id, data).then(() => {
			return manager.sessionStore.get(session_id).then(session => {
				assert.deepStrictEqual(session, data);
			});
		});
	});

	it('can store more than 64 KB of data per session', function() {
		const session_id = 'test-max-data';
		let data = {};
		data.lotsOfData = manager.fixtures.junkData['200KB'];
		return manager.sessionStore.set(session_id, data).then(() => {
			return manager.sessionStore.get(session_id).then(session => {
				assert.deepStrictEqual(session, data);
			});
		});
	});
});
