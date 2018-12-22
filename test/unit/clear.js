'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

describe('clear(cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('when sessions exist', function() {

		beforeEach(manager.populateSessions);

		it('should delete all existing sessions', function(done) {

			manager.sessionStore.clear(function(error) {
				expect(error).to.be.undefined;
				manager.sessionStore.length(function(error, count) {
					expect(error).to.equal(null);
					expect(count).to.equal(0);
					done();
				});
			});
		});
	});
});
