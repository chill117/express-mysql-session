'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

describe('length(cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('with no sessions', function() {

		it('should return 0', function(done) {
			manager.sessionStore.length(function(error, count) {
				if (error) return done(error);
				expect(count).to.equal(0);
				done();
			});
		});
	});

	describe('with at least some store sessions', function() {

		var total = 51;
		before(function(done) {
			manager.populateManySessions(total, done);
		});

		it('should return an accurate count', function(done) {
			manager.sessionStore.length(function(error, count) {
				if (error) return done(error);
				expect(count).to.equal(total);
				done();
			});
		});

		describe('where some are expired', function() {

			var numToExpire = Math.ceil(total / 6);
			before(function(done) {
				manager.expireSomeSessions(numToExpire, done);
			});

			it('should return an accurate count (excluding expired sessions)', function(done) {
				manager.sessionStore.length(function(error, count) {
					if (error) return done(error);
					expect(count).to.equal(total - numToExpire);
					done();
				});
			});
		});
	});
});
