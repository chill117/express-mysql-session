'use strict';

var async = require('async');
var fs = require('fs');

var SessionStore = require('../');

var config = {
	host: process.env.DB_HOST !== undefined ? process.env.DB_HOST : 'localhost',
	port: process.env.DB_PORT !== undefined ? process.env.DB_PORT : 3306,
	user: process.env.DB_USER !== undefined ? process.env.DB_USER : 'session_test',
	password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : 'password',
	database: process.env.DB_NAME !== undefined ? process.env.DB_NAME : 'session_test'
};

var fixtures = require('./fixtures');
var schemaSql = fs.readFileSync(__dirname + '/../schema.sql', 'utf-8');

var sessionStore = new SessionStore({
	host: config.host,
	port: config.port,
	user: config.user,
	password: config.password,
	database: config.database
});

var manager = module.exports = {

	config: config,
	fixtures: fixtures,
	sessionStore: sessionStore,
	SessionStore: SessionStore,

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
	}
};
