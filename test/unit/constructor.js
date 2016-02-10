'use strict';

var expect = require('chai').expect;
var mysql = require('mysql');

var manager = require('../manager');

describe('constructor', function() {

	var MySQLStore;

	beforeEach(manager.setUp);

	beforeEach(function() {

		if (require.cache[require.resolve('../..')]) {
			delete require.cache[require.resolve('../..')];
		}

		manager.MySQLStore = null;
	});

	afterEach(function() {

		manager.MySQLStore = require('../../');
	});

	afterEach(manager.tearDown);

	describe('require(\'express-mysql-session\')(session)', function() {

		var session;

		before(function() {

			session = require('express-session');
		});

		beforeEach(function() {

			MySQLStore = require('../..')(session);
		});

		it('MySQLStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MySQLStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.manager).to.not.equal(undefined);
					expect(sessionStore.manager.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('MySQLStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createConnection(manager.config);
			var sessionStore = new MySQLStore(options, connection, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.manager).to.not.equal(undefined);
					expect(sessionStore.manager.connection).to.deep.equal(connection);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});
	});

	describe('require(\'express-mysql-session\')', function() {

		beforeEach(function() {

			MySQLStore = require('../..');
		});

		it('MySQLStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MySQLStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.manager).to.not.equal(undefined);
					expect(sessionStore.manager.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('MySQLStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createConnection(manager.config);
			var sessionStore = new MySQLStore(options, connection, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.manager).to.not.equal(undefined);
					expect(sessionStore.manager.connection).to.deep.equal(connection);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});
	});
});
