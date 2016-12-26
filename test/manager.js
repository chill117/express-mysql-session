'use strict';

var _ = require('underscore');
var async = require('async');
var session = require('express-session');
var oracledb = require('oracledb');

var config = require('./config');
var fixtures = require('./fixtures');

var connection = {};



var manager = module.exports = {

	config: config,
	fixtures: fixtures,

	setUp: function(cb) {
		oracledb.getConnection(config,  function(err, conn) {
			if (err) {
				console.error(err.message);
				return;
			}
			connection = conn;
			async.series({
				tearDown: manager.tearDown,
				store: manager.createInstance
			}, function(error, results) {

				if (error) {
					return cb(error);
				}

				cb(null, results.store);
			});
		});
	},

	tearDown: function(cb) {

		async.series([
			manager.dropDatabaseTables
		], cb);
	},

	dropDatabaseTables: function(cb) {
		//var sql = 'DROP TABLE sessions';
		//connection.execute(sql, cb);
		cb();
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

		return oracleDbStore = manager.oracleDbStore = require('..')(session);
	},

	createInstance: function(options, cb) {

		if (typeof options === 'function') {
			cb = options;
			options = null;
		}

		options = _.defaults(options || {}, config);

		return sessionStore = new oracleDbStore(options, function(error) {

			if (error) {
				return cb(error);
			}

			cb(null, sessionStore);
		});
	}
};

var oracleDbStore = manager.oracleDbStore = manager.loadConstructor();
var sessionStore;
