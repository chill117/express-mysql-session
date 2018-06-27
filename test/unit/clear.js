'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

describe('clear(cb)', function() {

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

	describe('when sessions exist', function() {

		beforeEach(manager.populateSessions);

		it('should delete all existing sessions', function(done) {

			sessionStore.clear(function(error) {

				expect(error).to.be.undefined;

				sessionStore.length(function(error, count) {

					expect(error).to.equal(null);
					expect(count).to.equal(0);
					done();
				});
			});
		});
	});
});
