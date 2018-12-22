'use strict';

var _ = require('underscore');
var async = require('async');
var session = require('express-session');
var mysql = require('mysql');

var config = require('./config');
var fixtures = require('./fixtures');

var manager = module.exports = {

	config: config,
	fixtures: fixtures,
	stores: [],

	setUp: function(cb) {

		async.seq(manager.tearDown, manager.createInstance)(cb);
	},

	tearDown: function(cb) {

		async.seq(manager.dropDatabaseTables)(cb);
	},

	dropDatabaseTables: function(cb) {

		manager.sessionStore.connection.query('SHOW TABLES', function(error, rows) {

			async.each(rows, function(row, next) {

				var tableName = row['Tables_in_' + config.database];
				var sql = 'DROP TABLE IF EXISTS ??';
				var params = [tableName];

				manager.sessionStore.connection.query(sql, params, next);

			}, cb);
		});
	},

	expireSession: function(sessionId, cb) {

		var expiration = sessionStore.options.expiration;
		var sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
		var expires = ( new Date( Date.now() - (expiration + 60000) ) ) / 1000;
		var params = [
			sessionStore.options.schema.tableName,
			sessionStore.options.schema.columnNames.expires,
			expires,
			sessionStore.options.schema.columnNames.session_id,
			sessionId
		];
		sessionStore.connection.query(sql, params, cb);
	},

	expireSomeSessions: function(numToExpire, cb) {

		var expiration = sessionStore.options.expiration;
		var sql = 'UPDATE ?? SET ?? = ? LIMIT ?';
		var expires = ( new Date( Date.now() - (expiration + 60000) ) ) / 1000;
		var params = [
			sessionStore.options.schema.tableName,
			sessionStore.options.schema.columnNames.expires,
			expires,
			numToExpire
		];
		sessionStore.connection.query(sql, params, cb);
	},

	populateSessions: function(cb) {

		async.each(fixtures.sessions, manager.populateSession, cb);
	},

	populateSession: function(session, cb) {

		var sessionId = session.session_id;
		var data = session.data;
		sessionStore.set(sessionId, data, cb);
	},

	populateManySessions: function(targetNumSessions, prefix, cb) {

		if (typeof prefix === 'function') {
			cb = prefix;
			prefix = null;
		}

		prefix = prefix || '';
		var numSessions = 0;
		var expires = Math.round(Date.now() / 1000);
		var dataStr = JSON.stringify({
			someText: 'some sample text',
			someInt: 1001,
			moreText: 'and more sample text..'
		});

		async.whilst(function() { return numSessions < targetNumSessions; }, function(next) {

			var batchSize = Math.min(2000, targetNumSessions - numSessions);
			var sql = 'INSERT INTO ?? (??, ??, ??) VALUES ';
			var params = [
				sessionStore.options.schema.tableName,
				sessionStore.options.schema.columnNames.session_id,
				sessionStore.options.schema.columnNames.expires,
				sessionStore.options.schema.columnNames.data,
			];

			sql += _.chain(new Array(batchSize)).map(function() {
				return '(?, ?, ?)';
			}).value().join(', ');

			_.times(batchSize, function(index) {
				var sessionId = prefix + '-' + (numSessions + index);
				params = params.concat([sessionId, expires, dataStr]);
			});

			numSessions += batchSize;
			manager.sessionStore.connection.query(sql, params, next);

		}, cb);
	},

	clearSessions: function(cb) {

		sessionStore.clear(cb);
	},

	loadConstructor: function(forceReload) {

		forceReload = forceReload === true;

		if (forceReload && require.cache[require.resolve('..')]) {
			delete require.cache[require.resolve('..')];
		}

		return MySQLStore = manager.MySQLStore = require('..')(session);
	},

	createInstance: function(options, cb) {

		if (typeof options === 'function') {
			cb = options;
			options = null;
		}

		options = _.defaults(options || {}, config);
		cb = cb || _.noop;
		var store = new MySQLStore(options, cb);
		manager.stores.push(store);
		return store;
	},

};

var MySQLStore = manager.MySQLStore = manager.loadConstructor();
var sessionStore = manager.sessionStore = manager.createInstance();

after(function(done) {
	async.each(manager.stores, function(store, next) {
		store.close(next);
	}, function(error) {
		if (error) return done(error);
		manager.stores = [];
		done();
	});
});
