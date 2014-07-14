var debug_log = require('debug')('express-mysql-session:log')
var debug_error = require('debug')('express-mysql-session:error')
var express = require('express')
var fs = require('fs')
var MySQLConnectionManager = require('mysql-connection-manager')
var session = require('express-session')

var defaultOptions = {
	checkExpirationInterval: 900000,// How frequently expired sessions will be cleared; milliseconds.
	expiration: 86400000,// The maximum age of a valid session; milliseconds.
	autoReconnect: true,// Whether or not to re-establish a database connection after a disconnect.
	reconnectDelay: [
		500,// Time between each attempt in the first group of reconnection attempts; milliseconds.
		1000,// Time between each attempt in the second group of reconnection attempts; milliseconds.
		5000,// Time between each attempt in the third group of reconnection attempts; milliseconds.
		30000,// Time between each attempt in the fourth group of reconnection attempts; milliseconds.
		300000// Time between each attempt in the fifth group of reconnection attempts; milliseconds.
	],
	reconnectDelayGroupSize: 5,// Number of reconnection attempts per reconnect delay value.
	maxReconnectAttempts: 25,// Maximum number of reconnection attempts. Set to 0 for unlimited.
	useConnectionPooling: false,// Whether or not to use connection pooling.
	keepAlive: true,// Whether or not to send keep-alive pings on the database connection.
	keepAliveInterval: 30000,// How frequently keep-alive pings will be sent; milliseconds.
}

function SessionStore(options, connection) {

	this.options = options || {}

	this.setDefaultOptions()

	if (this.options.debug)
	{
		console.log('The \'debug\' option has been removed.')
		console.log('This module now uses the debug module to output logs and error messages.')
		console.log('Run your app with `DEBUG=express-mysql-session* node your-app.js` to have all logs and errors outputted to the console.')
	}

	var manager = new MySQLConnectionManager(options, connection || null)

	this.connection = manager.connection

	this.sync()

}

SessionStore.prototype = new session.Store()
SessionStore.prototype.constructor = SessionStore

SessionStore.prototype.setDefaultOptions = function() {

	for (var name in defaultOptions)
		if (typeof this.options[name] == 'undefined')
			this.options[name] = defaultOptions[name]

}

SessionStore.prototype.sync = function(cb) {

	var self = this

	fs.readFile(__dirname + '/../schema.sql', 'utf-8', function(error, sql) {

		self.connection.query(sql, function(error) {

			if (error)
			{
				if (self.options.debug)
				{
					debug_error('Failed to initialize SessionStore.')
					debug_error(error)
				}

				return cb && cb(error)
			}

			self.setExpirationInterval()

			cb && cb()

		})

	})

}

SessionStore.prototype.get = function(session_id, cb) {

	var sql = 'SELECT `data` FROM `sessions` WHERE `session_id` = ? LIMIT 1'
	var params = [ session_id ]

	this.connection.query(sql, params, function(error, rows) {

		if (error)
			return cb(error, null)

		var session = !!rows[0] ? JSON.parse(rows[0].data) : null

		cb(null, session)

	})

}

SessionStore.prototype.set = function(session_id, data, cb) {

	var sql = 'REPLACE INTO `sessions` SET ?'

	var expires

	if (data.cookie && data.cookie.expires)
		expires = data.cookie.expires
	else
		expires = new Date(Date.now() + this.options.expiration)

	// Use whole seconds here; not milliseconds.
	expires = Math.round(expires.getTime() / 1000)

	var params = {
		session_id: session_id,
		expires: expires,
		data: JSON.stringify(data)
	}

	var self = this

	this.connection.query(sql, params, function(error) {

		if (error)
			return cb && cb(error)

		cb && cb()

	})

}

SessionStore.prototype.destroy = function(session_id, cb) {

	var sql = 'DELETE FROM `sessions` WHERE `session_id` = ? LIMIT 1'
	var params = [ session_id ]

	var self = this

	this.connection.query(sql, params, function(error) {

		if (error)
		{
			if (self.options.debug)
			{
				debug_error('Failed to destroy session.')
				debug_error(error)
			}

			return cb && cb(error)
		}

		cb && cb()

	})

}

SessionStore.prototype.length = function(cb) {

	var sql = 'SELECT COUNT(*) FROM `sessions`'

	var self = this

	this.connection.query(sql, function(error, rows) {

		if (error)
		{
			if (self.options.debug)
			{
				debug_error('Failed to get number of sessions.')
				debug_error(error)
			}

			return cb && cb(error)
		}

		var count = !!rows[0] ? rows[0]['COUNT(*)'] : 0

		cb(null, count)

	})

}

SessionStore.prototype.clear = function(cb) {

	var sql = 'DELETE FROM `sessions`'

	this.connection.query(sql, function(error) {

		if (error)
			return cb && cb(error)

		cb && cb()

	})

}

SessionStore.prototype.clearExpiredSessions = function(cb) {

	var sql = 'DELETE FROM `sessions` WHERE `expires` < ?'
	var params = [ Math.round(Date.now() / 1000) ]

	var self = this

	this.connection.query(sql, params, function(error) {

		if (error)
		{
			if (self.options.debug)
			{
				debug_error('Failed to clear expired sessions.')
				debug_error(error)
			}

			return cb && cb(error)
		}

		cb && cb()

	})

}

SessionStore.prototype.setExpirationInterval = function(interval) {

	this.clearExpirationInterval()

	var self = this

	this._expirationInterval = setInterval(function() {

		self.clearExpiredSessions()

	}, interval || this.options.checkExpirationInterval)

}

SessionStore.prototype.clearExpirationInterval = function() {

	clearInterval(this._expirationInterval)

}

module.exports = SessionStore