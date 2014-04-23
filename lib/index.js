var express = require('express')
var fs = require('fs')
var mysql = require('mysql')
var session = require('express-session')

var defaultOptions = {
	debug: false,
	checkExpirationInterval: 900000,// 15 Minutes
	expiration: 86400000,// 1 Day
	autoReconnect: true,
	reconnectDelay: 200,// 200 Milliseconds
	maxReconnectAttempts: 25// Set to 0 for unlimited number of attempts.
}

function SessionStore(options, connection) {

	this.options = options || {}
	this.connection = connection || null

	this.initialize()

}

SessionStore.prototype = new session.Store()
SessionStore.prototype.constructor = SessionStore

SessionStore.prototype.initialize = function() {

	this.setDefaultOptions()

	if (!this.connection)
		this.connect()

	if (this.options.autoReconnect)
		this.listenForDisconnect()

	this.sync()

}

SessionStore.prototype.connect = function() {

	this.connection = mysql.createConnection(this.options)
	this.connection.connect()

}

SessionStore.prototype.reconnect = function() {

	if (
		this.options.maxReconnectAttempts &&
		this.failedReconnectAttempts >= this.options.maxReconnectAttempts
	)
		// No more attempts..
		return

	var self = this

	setTimeout(function() {

		self.failedReconnectAttempts++

		self.connect()

		self.connection.on('error', function(err) {

			self.reconnect()

		})

	}, this.reconnectDelay)

}

SessionStore.prototype.listenForDisconnect = function() {

	var self = this

	this.connection.on('error', function(err) {

		if (err.code == 'PROTOCOL_CONNECTION_LOST')
		{
			self.failedReconnectAttempts = 0
			self.reconnect()
		}

	})

}

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
					console.log('Failed to initialize SessionStore')
					console.log(error)
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
				console.log('Failed to destroy session: \'' + session_id + '\'')
				console.log(error)
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
				console.log('Failed to get number of sessions:')
				console.log(error)
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
				console.log('Failed to clear expired sessions:')
				console.log(error)
			}

			return cb && cb(error)
		}

		cb && cb()

	})

}

SessionStore.prototype.setExpirationInterval = function(interval) {

	clearInterval(this._expirationInterval)

	var self = this

	this._expirationInterval = setInterval(function() {

		self.clearExpiredSessions()

	}, interval || this.options.checkExpirationInterval)

}

module.exports = SessionStore