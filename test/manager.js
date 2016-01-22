'use strict';

var async = require('async');
var fs = require('fs');

var fixtures = require('./fixtures');
var schemaSql = fs.readFileSync(__dirname + '/../schema.sql', 'utf-8');
var SessionStore = require('./session-store');

var manager = module.exports = {

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

		SessionStore.connection.query(schemaSql, cb);
	},

	dropDatabaseTables: function(cb) {

		var sql = 'DROP TABLE IF EXISTS `sessions`';

		SessionStore.connection.query(sql, cb);
	},

	populateSessions: function(cb) {

		async.each(fixtures.sessions, function(session, next) {

			var session_id = session.session_id;
			var data = session.data;

			SessionStore.set(session_id, data, next);

		}, cb);
	},

	clearSessions: function(cb) {

		SessionStore.clear(cb);
	}
};
