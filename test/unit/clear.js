const assert = require('assert');
const manager = require('../manager');

describe('clear([callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		manager.sessionStore.clear(done);
	});

	describe('when sessions exist', function() {

		beforeEach(manager.populateSessions);

		it('should delete all existing sessions', function() {
			return manager.sessionStore.clear().then(() => {
				return manager.sessionStore.length().then(count => {
					assert.strictEqual(count, 0);
				});
			});
		});
	});
});
