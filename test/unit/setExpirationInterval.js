const assert = require('assert');
const manager = require('../manager');

describe('setExpirationInterval(interval)', function() {

	before(manager.setUp);

	let sessionStore;
	beforeEach(function() {
		sessionStore = manager.createInstance();
		return sessionStore.onReady();
	});

	after(manager.tearDown);

	it('should correctly set the check expiration interval time', function() {
		let numActual = 0;
		const intervalTime = 30;
		// Override the clearExpiredSessions method.
		sessionStore.clearExpiredSessions = function() {
			numActual++;
			return Promise.resolve();
		};
		return new Promise((resolve, reject) => {
			// Timeouts will never execute before the time given.
			// But they are not 100% guaranteed to execute exactly when you would expect.
			const startTime = Date.now();
			sessionStore.setExpirationInterval(intervalTime);
			setTimeout(function() {
				const numExpected = Math.floor((Date.now() - startTime) / intervalTime);
				try {
					assert.ok(numActual >= numExpected - 1);
				} catch (error) {
					return reject(error);
				}
				resolve();
			}, intervalTime * 3.5);
		});
	});
});
