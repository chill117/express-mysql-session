'use strict';

var _ = require('underscore');
var expect = require('chai').expect;
var mysql = require('mysql');
var session = require('express-session');

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

		beforeEach(function() {
			MySQLStore = require('../..')(session);
		});

		it('MySQLStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MySQLStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('MySQLStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createPool(manager.config);
			var sessionStore = new MySQLStore(options, connection, function(error) {

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

	describe('require(\'express-mysql-session\')', function() {

		beforeEach(function() {
			MySQLStore = require('../..');
		});

		it('MySQLStore(options, cb)', function(done) {

			var options = manager.config;
			var sessionStore = new MySQLStore(options, function(error) {

				try {

					expect(error).to.equal(undefined);
					expect(sessionStore.connection).to.not.equal(undefined);

				} catch (error) {
					return done(error);
				}

				done();
			});
		});

		it('MySQLStore(options, connection, cb)', function(done) {

			var options = {};
			var connection = mysql.createPool(manager.config);
			var sessionStore = new MySQLStore(options, connection, function(error) {

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

	describe('invalid schema option', function() {

		var MySQLStore;

		before(function() {
			MySQLStore = require('../..')(session);
		});

		it('should throw an error when defining invalid schema option', function() {

			var options = _.extend({
				schema: {
					columnNames: {
						unknownColumn: 'custom_column_name',
					},
				},
			}, manager.config);

			var thrownError;
			try {
				new MySQLStore(options);
			} catch (error) {
				thrownError = error;
			}
			expect(thrownError).to.not.be.undefined;
			expect(thrownError.message).to.equal('Unknwon column specified ("unknownColumn"). Only the following columns are configurable: "session_id", "expires", "data". Please review the documentation to understand how to correctly use this option.');
		});
	});
});
