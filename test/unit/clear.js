'use strict';

var expect = require('chai').expect;

var sessionStore = require('../session-store');
var manager = require('../manager');

describe('SessionStore#clear(cb)', function() {

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
