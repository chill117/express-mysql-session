'use strict';

var expect = require('chai').expect;
var mysql = require('mysql');

var manager = require('../manager');

describe('constructor', function() {

	var MysqlStore;

	beforeEach(manager.setUp);

	beforeEach(function() {

		if (require.cache[require.resolve('../..')]) {
			delete require.cache[require.resolve('../..')];
		}

		manager.MysqlStore = null;
	});

	afterEach(function() {

		manager.MysqlStore = require('../../');
	});

	afterEach(manager.tearDown);

	describe('require(\'express-mysql-session\')(session)', function() {

		var session;

		before(function() {

			session = require('express-session');
		});

		beforeEach(function() {

			MysqlStore = require('../..')(session);
		});

		it('MysqlStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MysqlStore(options, function(error) {

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

		it('MysqlStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createConnection(manager.config);
			var sessionStore = new MysqlStore(options, connection, function(error) {

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

			MysqlStore = require('../..');
		});

		it('MysqlStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MysqlStore(options, function(error) {

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

		it('MysqlStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createConnection(manager.config);
			var sessionStore = new MysqlStore(options, connection, function(error) {

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
