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
				cb(err);
			}
			connection = conn;
			//console.log("got connection");
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
		//console.log("dropDatabaseTables");
		var sql = `BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE sessions';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -942 THEN
         RAISE;
      END IF;
END;`;
		connection.execute(sql, cb);
	},

	populateSessions: function(cb) {
		//console.log("populateSessions");
		async.each(fixtures.sessions, function(session, next) {

			var session_id = session.session_id;
			var data = session.data;

			sessionStore.set(session_id, data, next);

		}, cb);
	},

	clearSessions: function(cb) {
		//console.log("clearSessions");
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

		//console.log("createInstance");

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
