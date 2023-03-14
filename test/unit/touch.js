const assert = require('assert');
const manager = require('../manager');
const fixtures = manager.fixtures.sessions;

describe('touch(session_id, data[, callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		const { session_id, data } = fixtures[0];
		manager.sessionStore.touch(session_id, data, done);
	});

	describe('when the session does not exist', function() {

		after(manager.clearSessions);

		it('should not create new session', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id, data } = fixture;
				return manager.sessionStore.touch(session_id, data).then(() => {
					return manager.sessionStore.get(session_id).then(session => {
						assert.strictEqual(session, null);
					});
				});
			}));
		});
	});

	describe('when the session exists', function() {

		const oldExpiresValue = Math.round((Date.now() / 1000)) - 10;

		before(function() {
			return manager.populateSessions().then(() => {
				const sql = 'UPDATE `sessions` SET `expires` = ?';
				const params = [ oldExpiresValue ];
				return manager.sessionStore.connection.query(sql, params);
			});
		});

		it('"expires" field should be updated, other fields should not be updated', function() {
			return Promise.all(fixtures.map(fixture => {
				const { session_id, data } = fixture;
				return manager.sessionStore.touch(session_id, data).then(() => {
					const sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions` WHERE `session_id` = ?';
					const params = [ session_id ];
					return manager.sessionStore.connection.query(sql, params).then(result => {
						const [ rows ] = result;
						const session = rows[0] || null;
						assert.ok(session);
						assert.strictEqual(session.session_id, session_id);
						assert.deepStrictEqual(JSON.parse(session.data), data);
						assert.ok(session.expires > oldExpiresValue);
					});
				});
			}));
		});
	});

	describe('disableTouch: true', function() {

		let sessionStore;
		before(function() {
			sessionStore = manager.createInstance({
				disableTouch: true,
			});
			return sessionStore.onReady();
		});

		const oldExpiresValue = Math.round((Date.now() / 1000)) - 280;
		const { session_id, data } = fixtures[0];
		before(function() {
			return sessionStore.set(session_id, data).then(() => {
				const sql = 'UPDATE `sessions` SET `expires` = ?';
				const params = [ oldExpiresValue ];
				return sessionStore.connection.query(sql, params);
			});
		})

		it('should do nothing', function() {
			return sessionStore.touch(session_id, data).then(() => {
				const sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions` WHERE `session_id` = ?';
				const params = [ session_id ];
				return sessionStore.connection.query(sql, params).then(result => {
					const [ rows ] = result;
					const session = rows[0] || null;
					assert.ok(session);
					assert.strictEqual(session.expires, oldExpiresValue);
				});
			});
		});
	});
});
