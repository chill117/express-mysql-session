const assert = require('assert');
const manager = require('../manager');
const fixtures = manager.fixtures.sessions;

describe('get(session_id[, callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		const { session_id } = fixtures[0];
		manager.sessionStore.get(session_id, (error, session) => {
			if (error) return done(error);
			try { assert.strictEqual(error, null); } catch (error) {
				return done(error);
			}
			done();
		});
	});

	describe('when a session exists', function() {

		let session_id;
		let data;
		beforeEach(function() {
			const fixture = fixtures[0] || null;
			assert.ok(fixture);
			session_id = fixture.session_id;
			data = fixture.data;
			return manager.populateSession(fixture);
		});

		describe('and is not expired', function() {

			it('should return its session data', function() {
				return manager.sessionStore.get(session_id).then(session => {
					assert.deepStrictEqual(session, data);
				});
			});
		});

		describe('and is expired', function() {

			beforeEach(function() {
				return manager.expireSession(session_id);
			});

			it('should return NULL', function() {
				return manager.sessionStore.get(session_id).then(session => {
					assert.strictEqual(session, null);
				});
			});
		});
	});

	describe('when a session does not exist', function() {

		beforeEach(manager.clearSessions);

		it('should return NULL', function() {
			const fixture = fixtures[1] || null;
			assert.ok(fixture);
			const { session_id } = fixture;
			return manager.sessionStore.get(session_id).then(session => {
				assert.strictEqual(session, null);
			});
		});
	});
});
