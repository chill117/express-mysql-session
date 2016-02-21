'use strict';

var expect = require('chai').expect;

var manager = require('../manager');

describe('sync(cb)', function() {

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

	describe('when the session database table does not yet exist', function() {

		beforeEach(manager.tearDown);
		afterEach(manager.tearDown);

		it('should create it', function(done) {

			sessionStore.sync(function(error) {

				if (error) {
					return done(error);
				}

				var sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions`';
				var params = [];

				sessionStore.connection.query(sql, params, done);
			});
		});
	});
});
