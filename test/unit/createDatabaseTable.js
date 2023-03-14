const assert = require('assert');
const manager = require('../manager');
const { MySQLStore } = manager;

describe('createDatabaseTable()', function() {

	const original_createDatabaseTable = MySQLStore.prototype.createDatabaseTable;
	afterEach(function() {
		MySQLStore.prototype.createDatabaseTable = original_createDatabaseTable;
	});

	afterEach(manager.tearDown);

	describe('when the session database table does not yet exist', function() {

		beforeEach(manager.tearDown);

		let sessionStore;
		beforeEach(function() {
			sessionStore = manager.createInstance({
				createDatabaseTable: false,
			});
			return sessionStore.onReady();
		});

		it('should create it', function() {
			return sessionStore.createDatabaseTable().then(() => {
				const sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions`';
				const params = [];
				return sessionStore.connection.query(sql, params);
			});
		});
	});

	describe('when the session database table already exists', function() {

		beforeEach(manager.setUp);

		it('should do nothing', function() {
			return manager.sessionStore.createDatabaseTable();
		});
	});

	describe('when \'options.createDatabaseTable\' is set to FALSE', function() {

		let sessionStore;
		beforeEach(manager.setUp);

		it('should not be called when a new sessionStore object is created', function() {
			MySQLStore.prototype.createDatabaseTable = function() {
				return Promise.reject(new Error('createDatabaseTable method should not have been called'));
			};
			sessionStore = manager.createInstance({
				createDatabaseTable: false,
			});
			return sessionStore.onReady();
		});
	});

	describe('when \'options.createDatabaseTable\' is set to TRUE', function() {

		let sessionStore;
		let options;
		beforeEach(function() {
			options = {
				createDatabaseTable: true,
			};
		});

		it('should be called when a new sessionStore object is created', function() {
			let called = false;
			MySQLStore.prototype.createDatabaseTable = function() {
				called = true;
				return Promise.resolve();
			};
			sessionStore = manager.createInstance(options);
			return sessionStore.onReady().then(() => {
				assert.strictEqual(called, true);
			});
		});

		describe('\'options.schema\'', function() {

			let sessionStore;
			afterEach(function() {
				return sessionStore.set('some-session-id', { some: 'data' });
			});

			afterEach(function() {
				const session_id = 'some-session-id';
				return sessionStore.set(session_id, { some: 'data' }).then(() => {
					return sessionStore.get(session_id);
				});
			});

			afterEach(function() {
				return sessionStore.destroy('some-session-id');
			});

			afterEach(function() {
				return sessionStore.length();
			});

			afterEach(function() {
				return sessionStore.clear();
			});

			const defaultSchema = {
				tableName: 'sessions',
				columnNames: {
					session_id: 'session_id',
					expires: 'expires',
					data: 'data',
				},
			};

			[
				{
					tableName: 'testSessionTable',
					columnNames: {
						session_id: 'testColumnSessionId',
						expires: 'testColumnExpires',
						data: 'testColumnData',
					},
				},
				{
					tableName: 'testSessionTable',
					columnNames: {
						session_id: 'testColumnSessionId',
					},
				},
				{
					tableName: 'testSessionTable',
				},
				{
					columnNames: {
						session_id: 'testColumnSessionId',
					},
				},
			].forEach(customSchema => {
				it(JSON.stringify(customSchema), function() {
					const storeOptions = Object.assign({}, options, {
						schema: customSchema,
					});
					const expectedSchema = Object.assign({}, defaultSchema, customSchema);
					expectedSchema.columnNames = Object.assign({}, defaultSchema.columnNames, expectedSchema.columnNames);
					sessionStore = manager.createInstance(storeOptions);
					return sessionStore.onReady().then(() => {
						const sql = 'SHOW COLUMNS FROM ??';
						const params = [ expectedSchema.tableName ];
						return sessionStore.connection.query(sql, params).then(rows => {
							assert.ok(Array.isArray(rows[0]));
							assert.strictEqual(rows[0].length, Object.keys(expectedSchema.columnNames).length);
							let columnExists = {};
							rows[0].forEach(row => {
								columnExists[row.Field] = true;
							});
							Object.values(expectedSchema.columnNames).forEach(columnName => {
								assert.ok(columnExists[columnName], `Missing column: "${columnName}"`);
							});
						});
					});
				});
			});
		});
	});
});
