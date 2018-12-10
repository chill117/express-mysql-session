'use strict';

var _ = require('underscore');
var expect = require('chai').expect;
var mysql = require('mysql');

var manager = require('../manager');
var MySQLStore = manager.MySQLStore;

describe('close(cb)', function() {

	describe('database connection created internally', function() {

		describe('default options', function() {

			var sessionStore;

			beforeEach(function(done) {
				sessionStore = new MySQLStore(manager.config, done);
			});

			it('should close the store and end the database connection', function(done) {

				sessionStore.close(function(error) {

					if (error) {
						return done(error);
					}

					expect(sessionStore._expirationInterval).to.equal(null);

					sessionStore.connection.query('SHOW TABLES', function(error, result) {
						expect(error).to.not.equal(null);
						expect(error.code).to.equal('POOL_CLOSED');
						done();
					});
				});
			});
		});

		describe('option.endConnectionOnClose set to FALSE', function() {

			var sessionStore;

			beforeEach(function(done) {

				var options = _.extend({}, manager.config, {
					endConnectionOnClose: false
				});

				sessionStore = new MySQLStore(options, done);
			});

			afterEach(function(done) {
				sessionStore.connection.end(done);
			});

			it('should close the store but not end the database connection', function(done) {

				sessionStore.close(function(error) {

					if (error) {
						return done(error);
					}

					expect(sessionStore._expirationInterval).to.equal(null);

					sessionStore.connection.query('SHOW TABLES', function(error, result) {
						expect(error).to.equal(null);
						done();
					});
				});
			});
		});
	});

	describe('database connection provided to constructor', function() {

		describe('default options', function() {

			var sessionStore;

			beforeEach(function(done) {
				var connection = mysql.createPool(manager.config);
				sessionStore = new MySQLStore({}/* options */, connection, done);
			});

			afterEach(function(done) {
				sessionStore.connection.end(done);
			});

			it('should close the store but not end the database connection', function(done) {

				sessionStore.close(function(error) {

					if (error) {
						return done(error);
					}

					expect(sessionStore._expirationInterval).to.equal(null);

					sessionStore.connection.query('SHOW TABLES', function(error, result) {
						expect(error).to.equal(null);
						done();
					});
				});
			});
		});

		describe('option.endConnectionOnClose set to TRUE', function() {

			var sessionStore;

			beforeEach(function(done) {

				var options = _.extend({}, manager.config, {
					endConnectionOnClose: true
				});

				sessionStore = new MySQLStore(options, done);
			});

			it('should close the store and end the database connection', function(done) {

				sessionStore.close(function(error) {

					if (error) {
						return done(error);
					}

					expect(sessionStore._expirationInterval).to.equal(null);

					sessionStore.connection.query('SHOW TABLES', function(error, result) {
						expect(error).to.not.equal(null);
						expect(error.code).to.equal('POOL_CLOSED');
						done();
					});
				});
			});
		});
	});
});
