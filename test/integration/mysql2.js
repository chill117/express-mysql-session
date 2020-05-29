'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var MySQLStore = require('../..')(session);
var manager = require('../manager');
var mysql2 = require('mysql2/promise');

describe('mysql2', function() {

	// Yes, tear-down only.
	before(manager.tearDown);

	var sessionStore;
	afterEach(function(done) {
		if (!sessionStore) return done();
		sessionStore.close(done);
	});

	after(manager.tearDown);

	it('sanity check', function(done) {
		var options = {
			endConnectionOnClose: true,
		};
		var connection = mysql2.createPool(manager.config);
		sessionStore = new MySQLStore(options, connection, function(error) {
			try {
				expect(error).to.be.undefined;
				expect(sessionStore.connection).to.deep.equal(connection);
			} catch (error) {
				return done(error);
			}
			sessionStore.length(function(error, length) {
				try {
					expect(error).to.equal(null);
					expect(length).to.equal(0);
				} catch (error) {
					return done(error);
				}
				done();
			});
		});
	});
});
