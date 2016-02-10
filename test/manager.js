'use strict';

var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var session = require('express-session');

var config = require('./config');
var fixtures = require('./fixtures');
var schemaSql = fs.readFileSync(__dirname + '/../schema.sql', 'utf-8');

var manager = module.exports = {

	config: config,
	fixtures: fixtures,

	setUp: function(cb) {

		async.series([
			manager.tearDown,
			manager.createDatabaseTables
		], cb);
	},

	tearDown: function(cb) {

		async.series([
			manager.dropDatabaseTables
		], cb);
	},

	createDatabaseTables: function(cb) {

		sessionStore.connection.query(schemaSql, cb);
	},

	dropDatabaseTables: function(cb) {

		var sql = 'DROP TABLE IF EXISTS `sessions`';

		sessionStore.connection.query(sql, cb);
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

		MysqlStore = manager.MysqlStore = require('..')(session);
		sessionStore = manager.sessionStore = manager.createInstance();

		return MysqlStore;
	},

	createInstance: function(options) {

		options = _.defaults(options || {}, config);

		return new MysqlStore(options);
	}
};

var MysqlStore = manager.MysqlStore = manager.loadConstructor();
var sessionStore = manager.sessionStore = manager.createInstance();
