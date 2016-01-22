'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var sessionStore = manager.sessionStore;

describe('SessionStore#sync(cb)', function() {

	describe('when the session database table does not yet exist', function() {

		after(manager.tearDown);

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
