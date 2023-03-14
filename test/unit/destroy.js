const assert = require('assert');
const manager = require('../manager');
const fixtures = manager.fixtures.sessions;

describe('destroy(session_id[, callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		const { session_id } = fixtures[0];
		manager.sessionStore.destroy(session_id, done);
	});

	describe('when the session exists', function() {

		before(manager.populateSessions);

		it('should delete the session', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id } = fixture;
				return manager.sessionStore.destroy(session_id).then(() => {
					return manager.sessionStore.get(session_id).then(session => {
						assert.strictEqual(session, null);
					});
				});
			}));
		});
	});

	describe('when the session does not exist', function() {

		before(manager.clearSessions);

		it('should do nothing', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id } = fixture;
				return manager.sessionStore.destroy(session_id);
			}));
		});
	});
});
