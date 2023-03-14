const assert = require('assert');
const crypto = require('crypto');
const session = require('express-session');
const config = require('./config');
const fixtures = require('./fixtures');

const MySQLStore = require('..')(session);
let sessionStore;

let manager = module.exports = {

	config,
	fixtures,
	MySQLStore,
	stores: [],

	setUp: function() {
		return manager.tearDown().then(() => {
			sessionStore = manager.sessionStore = manager.createInstance();
			return sessionStore.onReady();
		});
	},

	tearDown: function() {
		return Promise.resolve().then(() => {
			if (!manager.sessionStore) {
				sessionStore = manager.sessionStore = manager.createInstance();
				return sessionStore.onReady();
			}
		}).then(() => {
			return manager.dropDatabaseTables();
		});
	},

	dropDatabaseTables: function() {
		return manager.sessionStore.connection.query('SHOW TABLES').then(rows => {
			return Promise.all(rows[0].map(row => {
				const tableName = row[`Tables_in_${config.database}`];
				assert.ok(tableName);
				const sql = 'DROP TABLE IF EXISTS ??';
				const params = [ tableName ];
				return manager.sessionStore.connection.query(sql, params);
			}));
		});
	},

	expireSession: function(sessionId) {
		return Promise.resolve().then(() => {
			const expiration = sessionStore.options.expiration;
			const sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
			const expires = ( new Date( Date.now() - (expiration + 60000) ) ) / 1000;
			const params = [
				sessionStore.options.schema.tableName,
				sessionStore.options.schema.columnNames.expires,
				expires,
				sessionStore.options.schema.columnNames.session_id,
				sessionId,
			];
			return sessionStore.connection.query(sql, params);
		});
	},

	expireSomeSessions: function(numToExpire) {
		return Promise.resolve().then(() => {
			const expiration = sessionStore.options.expiration;
			const sql = 'UPDATE ?? SET ?? = ? LIMIT ?';
			const expires = Math.round((Date.now() - (expiration + 300000)) / 1000);
			const params = [
				sessionStore.options.schema.tableName,
				sessionStore.options.schema.columnNames.expires,
				expires,
				numToExpire,
			];
			return sessionStore.connection.query(sql, params);
		});
	},

	populateSessions: function() {
		return Promise.all(fixtures.sessions.map(session => {
			return manager.populateSession(session);
		}));
	},

	populateSession: function(session) {
		return Promise.resolve().then(() => {
			const { session_id, data } = session;
			return sessionStore.set(session_id, data);
		});
	},

	populateManySessions: function(targetNumSessions, prefix) {
		return Promise.resolve().then(() => {
			targetNumSessions = targetNumSessions || 0;
			prefix = prefix || crypto.randomBytes(20).toString('hex');
			assert.ok(targetNumSessions > 0, 'Invalid argument ("targetNumSessions"): Must be greater than 0');
			const expires = Math.round(Date.now() / 1000);
			const dataStr = JSON.stringify({
				someText: 'some sample text',
				someInt: 1001,
				moreText: 'and more sample text..',
			});
			const maxBatchSize = 500;
			const numLoops = Math.ceil(targetNumSessions / maxBatchSize);
			return MySQLStore.promiseAllSeries(Array.from(new Array(numLoops), (_,x) => x).map(batchIndex => {
				return function() {
					return Promise.resolve().then(() => {
						const numSessions = batchIndex * maxBatchSize;
						const batchSize = Math.min(maxBatchSize, targetNumSessions - numSessions);
						let sql = 'INSERT INTO ?? (??, ??, ??) VALUES ';
						let params = [
							sessionStore.options.schema.tableName,
							sessionStore.options.schema.columnNames.session_id,
							sessionStore.options.schema.columnNames.expires,
							sessionStore.options.schema.columnNames.data,
						];
						sql += Array.from(new Array(batchSize)).map(() => {
							return '(?, ?, ?)';
						}).join(', ');
						Array.from(new Array(batchSize), (_,x) => x).forEach(itemIndex => {
							const sessionId = prefix + '-' + (numSessions + (itemIndex++));
							params = params.concat([sessionId, expires, dataStr]);
						});
						return manager.sessionStore.connection.query(sql, params);
					});
				};
			}));
		});
	},

	clearSessions: function() {
		return sessionStore.clear();
	},

	createInstance: function(options, connection) {
		options = Object.assign({}, config, options || {});
		const store = new MySQLStore(options, connection);
		manager.stores.push(store);
		return store;
	},

};

after(function() {
	return Promise.all(manager.stores.map((store, index) => {
		return store.close();
	})).then(() => {
		manager.stores = [];
	});
});
