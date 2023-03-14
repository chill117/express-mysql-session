const assert = require('assert');
const manager = require('../manager');

describe('all([callback])', function() {

	before(manager.setUp);
	after(manager.tearDown);

	it('callback', function(done) {
		manager.sessionStore.all((error, sessions) => {
			if (error) return done(error);
			try { assert.deepStrictEqual(sessions, {}); } catch (error) {
				return done(error);
			}
			done();
		});
	});

	describe('with no sessions', function() {

		it('should return an empty object', function() {
			return manager.sessionStore.all().then(sessions => {
				assert.deepStrictEqual(sessions, {});
			});
		});
	});

	describe('when sessions exist', function() {

		const total = 33;
		before(function() {
			return manager.populateManySessions(total);
		});

		it('should return all sessions as an object', function() {
			return manager.sessionStore.all().then(sessions => {
				assert.strictEqual(typeof sessions, 'object');
				assert.strictEqual(Object.keys(sessions).length, total);
				Object.entries(sessions).forEach(function([id, data], index) {
					assert.strictEqual(typeof data, 'object');
					assert.strictEqual(typeof id, 'string');
				});
			});
		});

		describe('where some are expired', function() {

			const numToExpire = Math.ceil(total / 6);
			before(function() {
				return manager.expireSomeSessions(numToExpire);
			});

			it('should return all sessions as an object (excluding expired sessions)', function() {
				return manager.sessionStore.all().then(sessions => {
					assert.strictEqual(typeof sessions, 'object');
					assert.strictEqual(Object.keys(sessions).length, total - numToExpire);
				});
			});
		});
	});
});
