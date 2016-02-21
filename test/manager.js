'use strict';

var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var session = require('express-session');
var mysql = require('mysql');

var config = require('./config');
var fixtures = require('./fixtures');
var schemaSql = fs.readFileSync(__dirname + '/../schema.sql', 'utf-8');

var connection = mysql.createConnection(config);

var manager = module.exports = {

	config: config,
	fixtures: fixtures,

	setUp: function(cb) {

		async.series({
			tearDown: manager.tearDown,
			store: manager.createInstance
		}, function(error, results) {

			if (error) {
				return cb(error);
			}

			cb(null, results.store);
		});
	},

	tearDown: function(cb) {

		async.series([
			manager.dropDatabaseTables
		], cb);
	},

	dropDatabaseTables: function(cb) {

		connection.query('SHOW TABLES', function(error, rows) {

			async.each(rows, function(row, next) {

				var tableName = row['Tables_in_' + config.database];
				var sql = 'DROP TABLE IF EXISTS ??';
				var params = [tableName];

				connection.query(sql, params, next);

			}, cb);
		});
	},

	populateSessions: function(cb) {

		async.each(fixtures.sessions, function(session, next) {

			var session_id = session.session_id;
			var data = session.data;

			sessionStore.set(session_id, data, next);

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

		return sessionStore = new MySQLStore(options, function(error) {

			if (error) {
				return cb(error);
			}

			cb(null, sessionStore);
		});
	}
};

var MySQLStore = manager.MySQLStore = manager.loadConstructor();
var sessionStore;
