'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../manager');
var MySQLStore = manager.MySQLStore;

describe('createDatabaseTable(cb)', function() {

	afterEach(function() {
		MySQLStore = manager.loadConstructor(true);
	});

	afterEach(manager.tearDown);

	var testMatrix = [
		{ jsonData: undefined, columnType: 'mediumtext'},
		{ jsonData: false, columnType: 'mediumtext' },
		{ jsonData: true, columnType: 'json'},
	];

	_.each(testMatrix, function(context) {
		describe('when options.jsonData is set to ' + context.jsonData, function() {

			describe('when the session database table does not yet exist', function() {

				var sessionStore;
				afterEach(function(done) {
					if (!sessionStore) return done();
					sessionStore.close(done);
				});

				beforeEach(function(done) {
					sessionStore = manager.createInstance({ jsonData: context.jsonData }, done);
				});

				beforeEach(manager.tearDown);

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

				it('should create the data column with the ' + context.columnType + ' data type', function(done) {
					sessionStore.createDatabaseTable(function(error) {

						if (error) {
							return done(error);
						}

						var sql = 'SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = ? AND column_name = ?';
						var params = ['sessions', 'data'];

						sessionStore.connection.query(sql, params, function(error, rows) {
							expect(rows).to.be.an('array');
							expect(rows).to.have.length(1);
							expect(rows[0]['data_type']).to.eq(context.columnType);
							done();
						});
					});
				});
			});
		});
	});

	describe('when the session database table already exists', function() {

		var sessionStore;
		afterEach(function(done) {
			if (!sessionStore) return done();
			sessionStore.close(done);
		});

		beforeEach(manager.setUp);

		beforeEach(function(done) {
			sessionStore = manager.createInstance(done);
		});

		it('should do nothing', function(done) {
			sessionStore.createDatabaseTable(done);
		});
	});

	describe('when \'options.createDatabaseTable\' is set to FALSE', function() {

		var sessionStore;
		afterEach(function(done) {
			if (!sessionStore) return done();
			sessionStore.close(done);
		});

		beforeEach(manager.setUp);

		it('should not be called when a new sessionStore object is created', function(done) {

			var called = false;

			MySQLStore.prototype.createDatabaseTable = function() {

				called = true;
				done(new Error('createDatabaseTable method should not have been called'));
			};

			var options = _.extend({}, manager.config, {
				createDatabaseTable: false
			});

			sessionStore = new MySQLStore(options, function(error) {

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

		var sessionStore;
		afterEach(function(done) {
			if (!sessionStore) return done();
			sessionStore.close(done);
		});

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

			sessionStore = new MySQLStore(options, function(error) {

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

			afterEach(function(done) {
				if (!sessionStore) return done();
				sessionStore.close(done);
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

					sessionStore = new MySQLStore(storeOptions, function(error) {

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
