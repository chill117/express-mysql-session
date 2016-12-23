'use strict';

var expect = require('chai').expect;
var oracledb = require('oracledb');

var manager = require('../manager');

describe('constructor', function() {

	var oracleDbStore;

	beforeEach(manager.setUp);

	beforeEach(function() {

		if (require.cache[require.resolve('../..')]) {
			delete require.cache[require.resolve('../..')];
		}

		manager.oracleDbStore = null;
	});

	afterEach(function() {

		manager.oracleDbStore = require('../../');
	});

	afterEach(manager.tearDown);

	describe('require(\'express-mysql-session\')(session)', function() {

		var session;

		before(function() {

			session = require('express-session');
		});

		beforeEach(function() {

			oracleDbStore = require('../..')(session);
		});

		it('oracleDbStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new oracleDbStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('oracleDbStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = oracledb.getConnection(manager.config, function(err, conn){
			var sessionStore = new oracleDbStore(options, connection, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.connection).to.deep.equal(connection);

				} catch (error) {
					return done(error);
				}

				done();
			});
			});
		});
	});

	describe('require(\'express-mysql-session\')', function() {

		beforeEach(function() {

			oracleDbStore = require('../..');
		});

		it('oracleDbStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new oracleDbStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('oracleDbStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = oracledb.getConnection(manager.config, function(err, conn){
				var sessionStore = new oracleDbStore(options, connection, function(error) {

					try {

						expect(error).to.equal(undefined);
						expect(sessionStore.connection).to.deep.equal(connection);

					} catch (error) {
						return done(error);
					}

					done();
				});
			});
		});
	});
});
