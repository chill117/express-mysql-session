'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var sessionStore = manager.sessionStore;

describe('clear(cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when sessions exist', function() {

		before(manager.populateSessions);

		it('should delete all existing sessions', function(done) {

			sessionStore.clear(function(error) {

				expect(error).to.equal(undefined);

				sessionStore.length(function(error, count) {

					expect(error).to.equal(null);
					expect(count).to.equal(0);
					done();
				});
			});
		});
	});
});
