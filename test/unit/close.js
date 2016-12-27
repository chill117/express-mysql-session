'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

['close'].forEach(function(methodName) {

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

		it('should close the store and its Oracle conenction(s)', function(done) {

			sessionStore[methodName](function(error) {

				if (error) {
					return done(error);
				}

				expect(sessionStore._expirationInterval).to.equal(null);

				// Any queries against the database should now fail.
				sessionStore.length(function(error, count) {
					expect(error.message).to.equal('NJS-003: invalid connection');
					done();
				});
			});
		});
	});
});
