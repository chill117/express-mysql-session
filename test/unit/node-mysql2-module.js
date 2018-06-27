'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var MySQLStore = require('../..')(session);
var manager = require('../manager');

describe('node-mysql2-module', function() {

	// Yes, tear-down only.
	before(manager.tearDown);
	after(manager.tearDown);

	it('support promise', function(done) {

		var mysql2 = require('mysql2/promise');
		var options = {};
		var connection = mysql2.createPool(manager.config);
		var sessionStore = new MySQLStore(options, connection, function(error) {
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
