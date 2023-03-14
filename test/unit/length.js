const assert = require('assert');
const manager = require('../manager');

describe('length([callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		manager.sessionStore.length((error, count) => {
			if (error) return done(error);
			try { assert.strictEqual(count, 0); } catch (error) {
				return done(error);
			}
			done();
		});
	});

	describe('with no sessions', function() {

		it('should return 0', function() {
			return manager.sessionStore.length().then(count => {
				assert.strictEqual(count, 0);
			});
		});
	});

	describe('with at least some store sessions', function() {

		const total = 51;
		before(function() {
			return manager.populateManySessions(total);
		});

		it('should return an accurate count', function() {
			return manager.sessionStore.length().then(count => {
				assert.strictEqual(count, total);
			});
		});

		describe('where some are expired', function() {

			const numToExpire = Math.ceil(total / 6);
			before(function() {
				return manager.expireSomeSessions(numToExpire);
			});

			it('should return an accurate count (excluding expired sessions)', function() {
				return manager.sessionStore.length().then(count => {
					assert.strictEqual(count, total - numToExpire);
				});
			});
		});
	});
});
