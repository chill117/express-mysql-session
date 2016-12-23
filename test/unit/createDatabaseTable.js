'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');
var oracleDbStore = manager.oracleDbStore;

describe('createDatabaseTable(cb)', function() {

	afterEach(function() {

		oracleDbStore = manager.loadConstructor(true);
	});

	after(manager.tearDown);

	describe('when the session database table does not yet exist', function() {

		var sessionStore;

		before(function(done) {

			sessionStore = manager.createInstance(done);
		});

		before(manager.tearDown);
		after(manager.tearDown);

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

		var sessionStore;

		before(function(done) {

			sessionStore = manager.createInstance(done);
		});

		before(manager.setUp);
		after(manager.tearDown);

		it('should do nothing', function(done) {

			sessionStore.createDatabaseTable(done);
		});
	});

	describe('when \'options.createDatabaseTable\' is set to FALSE', function() {

		it('should not be called when a new sessionStore object is created', function(done) {

			var called = false;

			oracleDbStore.prototype.createDatabaseTable = function() {

				called = true;
				done(new Error('createDatabaseTable method should not have been called'));
			};

			var options = _.extend({}, manager.config, {
				createDatabaseTable: false
			});

			new oracleDbStore(options, function(error) {

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

			oracleDbStore.prototype.createDatabaseTable = function(cb) {

				called = true;
				cb && cb();
			};

			new oracleDbStore(options, function(error) {

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

			beforeEach(manager.tearDown);

			var sessionStore;

			afterEach(function(done) {

				sessionStore.set('some-session-id', { some: 'data' }, done);
			});

			afterEach(function(done) {

				var session_id = 'some-session-id';

				sessionStore.set(session_id, { some: 'data' }, function(error) {

					if (error) {
						return done(error);
					}

					sessionStore.get(session_id, done);
				});
			});

			afterEach(function(done) {

				sessionStore.destroy('some-session-id', done);
			});

			afterEach(function(done) {

				sessionStore.length(done);
			});

			afterEach(function(done) {

				sessionStore.clear(done);
			});

			afterEach(function() {

				sessionStore.close();
			});

			var customSchemas = [
				{
					tableName: 'testSessionTable',
					columnNames: {
						session_id: 'testColumnSessionId',
						expires: 'testColumnExpires',
						data: 'testColumnData'
					}
				},
				{
					tableName: 'testSessionTable',
					columnNames: {
						session_id: 'testColumnSessionId'
					}
				},
				{
					tableName: 'testSessionTable'
				},
				{
					columnNames: {
						session_id: 'testColumnSessionId'
					}
				}
			];

			var defaultSchema = {
				tableName: 'sessions',
				columnNames: {
					session_id: 'session_id',
					expires: 'expires',
					data: 'data'
				}
			};

			_.each(customSchemas, function(customSchema) {

				it(JSON.stringify(customSchema), function(done) {

					var storeOptions = _.extend({}, options, {
						schema: customSchema
					});

					var expectedSchema = _.defaults(customSchema, defaultSchema);

					expectedSchema.columnNames = _.defaults(expectedSchema.columnNames, defaultSchema.columnNames);

					sessionStore = new oracleDbStore(storeOptions, function(error) {

						if (error) {
							return done(error);
						}

						var sql = 'SHOW COLUMNS FROM ??';
						var params = [expectedSchema.tableName];

						sessionStore.connection.query(sql, params, function(error, rows) {

							if (error) {
								return done(error);
							}

							try {

								expect(rows).to.be.an('array');
								expect(rows).to.have.length(_.size(expectedSchema.columnNames));

								var columnExists = _.object(_.map(rows, function(row) {
									return [row.Field, true];
								}));

								_.each(expectedSchema.columnNames, function(columnName) {

									if (!columnExists[columnName]) {
										throw new Error('Missing column: "' + columnName + '"');
									}
								});

							} catch (error) {
								return done(error);
							}

							done();
						});
					});
				});
			});
		});
	});
});
