'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');
var sessionStore = manager.sessionStore;
var MySQLStore = manager.MySQLStore;

describe('createDatabaseTable(cb)', function() {

	before(manager.tearDown);

	afterEach(function() {

		MySQLStore = manager.loadConstructor(true);
	});

	after(manager.tearDown);

	describe('when the session database table does not yet exist', function() {

		afterEach(manager.tearDown);

		it('should create it', function(done) {

			sessionStore.createDatabaseTable(function(error) {

				if (error) {
					return done(error);
				}

				var sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions`';
				var params = [];

				sessionStore.connection.query(sql, params, done);
			});
		});
	});

	describe('when the session database table already exists', function() {

		before(manager.setUp);

		it('should do nothing', function(done) {

			sessionStore.createDatabaseTable(done);
		});
	});

	describe('when \'options.createDatabaseTable\' is set to FALSE', function() {

		it('should not be called when a new sessionStore object is created', function(done) {

			var called = false;

			MySQLStore.prototype.createDatabaseTable = function() {

				called = true;
				done(new Error('createDatabaseTable method should not have been called'));
			};

			var options = _.extend({}, manager.config, {
				createDatabaseTable: false
			});

			new MySQLStore(options, function(error) {

				if (called) {
					return;
				}

				if (error) {
					return done(error);
				}

				done();
			});
		});
	});

	describe('when \'options.createDatabaseTable\' is set to TRUE', function() {

		var options;

		beforeEach(function() {

			options = _.extend({}, manager.config, {
				createDatabaseTable: true
			});
		});

		it('should be called when a new sessionStore object is created', function(done) {

			var called = false;

			MySQLStore.prototype.createDatabaseTable = function(cb) {

				called = true;
				cb && cb();
			};

			new MySQLStore(options, function(error) {

				if (error) {
					return done(error);
				}

				if (!called) {
					return done(new Error('createDatabaseTable method should have been called'));
				}

				done();
			});
		});

		describe('\'options.schema\'', function() {

			var sessionStore;

			beforeEach(function(done) {

				options = _.extend(options, {
					schema: {
						tableName: 'testSessionTable',
						columnNames: {
							session_id: 'testColumnSessionId',
							expires: 'testColumnExpires',
							data: 'testColumnData'
						}
					}
				});

				sessionStore = new MySQLStore(options, done);
			});

			afterEach(function() {

				sessionStore.closeStore();
			});

			it('should create a database table with the correct name and columns', function(done) {

				var sql = 'SHOW COLUMNS FROM ??';
				var params = [options.schema.tableName];

				sessionStore.connection.query(sql, params, function(error, rows) {

					if (error) {
						return done(error);
					}

					expect(rows).to.be.an('array');
					expect(rows).to.have.length(3);
					expect(rows[0].Field).to.equal(options.schema.columnNames.session_id);
					expect(rows[1].Field).to.equal(options.schema.columnNames.expires);
					expect(rows[2].Field).to.equal(options.schema.columnNames.data);
					done();
				});
			});

			it('set() should work', function(done) {

				sessionStore.set('some-session-id', { some: 'data' }, done);
			});

			it('get(session_id, cb) should work', function(done) {

				var session_id = 'some-session-id';

				sessionStore.set(session_id, { some: 'data' }, function(error) {

					if (error) {
						return done(error);
					}

					sessionStore.get(session_id, done);
				});
			});

			it('destroy() should work', function(done) {

				sessionStore.destroy('some-session-id', done);
			});

			it('length() should work', function(done) {

				sessionStore.length(done);
			});

			it('clear() should work', function(done) {

				sessionStore.clear(done);
			});
		});
	});
});
