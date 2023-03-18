const assert = require('assert');
const manager = require('../manager');
const fixtures = manager.fixtures.sessions;

describe('clearExpiredSessions()', function() {

	before(manager.setUp);
	before(manager.populateSessions);

	const numExpired = fixtures.length - 2;
	before(function() {
		return manager.expireSomeSessions(numExpired);
	});

	after(manager.tearDown);

	it('should clear expired sessions', function() {
		return manager.sessionStore.clearExpiredSessions().then(() => {
			return manager.sessionStore.length().then(count => {
				assert.strictEqual(count, fixtures.length - numExpired);
			});
		});
	});
});
