/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, node:true, unused:true, curly:true, white:true, indent:4, maxerr:50 */
var _ = require('underscore');
var async = require('async');
var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var RECONNECT_DELAY = 100; // We wait for this many milliseconds before trying to reconnect if our first (immediate) reconnect attempt fails.
var defaultOptions = {
	debug: false,
	checkExpirationInterval: 900000,// 15 Minutes
	expiration: 86400000// 1 Day
};
(function () {
	"use strict";
	function SessionStore(options, connection) {
		this.options = _.extend(defaultOptions, options) || defaultOptions;
		this.connection = connection || null;

		this.initialize();

	}

	_.extend(SessionStore.prototype, express.session.Store.prototype, {

		initialize: function () {
			var self = this;
			function reconnect(quiet) {
				if (!quiet) {
					console.log('express-mysql-session disconnected from MySQL. Reconnecting');
				}
				self.connection = mysql.createConnection(self.options);
				self.connection.connect(function (err) {
					if (err) {
						setTimeout(function () {
							reconnect();
						}, self.options.reconnectDelay || RECONNECT_DELAY);
					} else {
						console.log('express-mysql-session connected to MySql');
					}
				});
				self.connection.on('error', function (err) {
					if (err.code === 'PROTOCOL_CONNECTION_LOST') {
						reconnect();
					}
				});
			}
			if (!self.connection)
			{
				reconnect(true);
			}
			this.sync();

		},

		sync: function (cb) {

			var self = this;

			fs.readFile(__dirname + '/../schema.sql', 'utf-8', function (error, sql) {

				self.connection.query(sql, function (error) {

					if (error)
					{
						if (self.options.debug)
						{
							console.log('Failed to initialize SessionStore');
							console.log(error);
						}

						return cb && cb(error);
					}

					self.setExpirationInterval();

					if (cb) {
						cb();
					}

				});

			});

		},

		get: function (session_id, cb) {

			var sql = 'SELECT `data` FROM `sessions` WHERE `session_id` = ? LIMIT 1';
			var params = [ session_id ];

			this.connection.query(sql, params, function (error, rows) {

				if (error) {
					return cb(error, null);
				}

				var session = !!rows[0] ? JSON.parse(rows[0].data) : null;

				cb(null, session);

			});

		},

		set: function (session_id, data, cb) {

			var sql = 'REPLACE INTO `sessions` SET ?';

			var expires;

			if (data.cookie && data.cookie.expires) {
				expires = data.cookie.expires;
			}
			else {
				expires = new Date(Date.now() + this.options.expiration);
			}

			// Use whole seconds here; not milliseconds.
			expires = Math.round(expires.getTime() / 1000);

			var params = {
				session_id: session_id,
				expires: expires,
				data: JSON.stringify(data)
			};

			this.connection.query(sql, params, function (error) {

				if (error) {
					return cb && cb(error);
				}

				if (cb) {
					cb();
				}
			});

		},

		destroy: function (session_id, cb) {

			var sql = 'DELETE FROM `sessions` WHERE `session_id` = ? LIMIT 1';
			var params = [ session_id ];

			var self = this;

			this.connection.query(sql, params, function (error) {

				if (error)
				{
					if (self.options.debug)
					{
						console.log('Failed to destroy session: \'' + session_id + '\'');
						console.log(error);
					}

					return cb && cb(error);
				}

				if (cb) {
					cb();
				}
			});

		},

		length: function (cb) {

			var sql = 'SELECT COUNT(*) FROM `sessions`';
			var self = this;
			this.connection.query(sql, function (error, rows) {

				if (error)
				{
					if (self.options.debug)
					{
						console.log('Failed to get number of sessions:');
						console.log(error);
					}

					return cb && cb(error);
				}

				var count = !!rows[0] ? rows[0]['COUNT(*)'] : 0;

				cb(null, count);

			});

		},

		clear: function (cb) {

			var sql = 'DELETE FROM `sessions`';

			this.connection.query(sql, function (error) {

				if (error) {
					return cb && cb(error);
				}

				if (cb) {
					cb();
				}
			});

		},

		clearExpiredSessions: function (cb) {

			var sql = 'SELECT `session_id` FROM `sessions` WHERE `expires` < ?';
			var params = [ Math.round(Date.now() / 1000) ];

			var self = this;

			this.connection.query(sql, params, function (error, rows) {

				if (error)
				{
					if (self.options.debug)
					{
						console.log('Failed to get expired sessions:');
						console.log(error);
					}

					return cb && cb(error);

				}

				async.each(rows, function (row, nextRow) {

					self.destroy(row.session_id);
					nextRow();

				}, cb || function () {});

			});

		},

		setExpirationInterval: function (interval) {

			if (interval) {
				this.options.checkExpirationInterval = interval;
			}

			clearInterval(this._expirationInterval);

			this._expirationInterval = setInterval(_.bind(this.clearExpiredSessions, this), this.options.checkExpirationInterval);

		}

	});
	module.exports = SessionStore;
}());