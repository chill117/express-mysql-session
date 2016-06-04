'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

['close', 'closeStore'].forEach(function(methodName) {

	describe(methodName + '(cb)', function() {

		var sessionStore;

		before(function(done) {

			manager.setUp(function(error, store) {

				if (error) {
					return done(error);
				}

				sessionStore = store;
				done();
			});
		});

		after(manager.tearDown);

		it('should close the store and its MySQL conenction(s)', function(done) {

			sessionStore[methodName](function(error) {

				if (error) {
					return done(error);
				}

				expect(sessionStore._expirationInterval).to.equal(null);

				// Any queries against the database should now fail.
				sessionStore.length(function(error, count) {
					expect(error.code).to.equal('PROTOCOL_ENQUEUE_AFTER_QUIT');
					done();
				});
			});
		});
	});
});
