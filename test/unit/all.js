'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');

describe('all(cb)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	describe('with no sessions', function() {

		it('should return an empty object', function(done) {
			manager.sessionStore.all(function(error, sessions) {
				if (error) return done(error);
				expect(sessions).to.deep.equal({});
				done();
			});
		});
	});

	describe('when sessions exist', function() {

		var total = 51;
		before(function(done) {
			manager.populateManySessions(total, done);
		});

		it('should return all sessions as an object', function(done) {
			manager.sessionStore.all(function(error, sessions) {
				if (error) return done(error);
				expect(sessions).to.be.an('object');
				expect(_.keys(sessions)).to.have.length(total);
				_.each(sessions, function(data, id) {
					expect(data).to.be.an('object');
					expect(id).to.be.a('string');
				});
				done();
			});
		});

		describe('where some are expired', function() {

			var numToExpire = Math.ceil(total / 6);
			before(function(done) {
				manager.expireSomeSessions(numToExpire, done);
			});

			it('should return all sessions as an object (excluding expired sessions)', function(done) {
				manager.sessionStore.all(function(error, sessions) {
					if (error) return done(error);
					expect(sessions).to.be.an('object');
					expect(_.keys(sessions)).to.have.length(total - numToExpire);
					done();
				});
			});
		});
	});
});
