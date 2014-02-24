var _ = require('underscore')
var express = require('express')
var fs = require('fs')
var mysql = require('mysql')

var defaultOptions = {
	debug: false,
	checkExpirationInterval: 900000,// 15 Minutes
	expiration: 86400000// 1 Day
}

function SessionStore(options, connection) {

	this.options = _.extend(defaultOptions, options) || defaultOptions
	this.connection = connection || null

	this.initialize()

}

_.extend(SessionStore.prototype, express.session.Store.prototype, {

	initialize: function() {

		if (!this.connection)
		{
			this.connection = mysql.createConnection(this.options)
			this.connection.connect()
		}

		this.sync()

	},

	sync: function(cb) {

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

				setInterval(self.clearExpiredSessions, self.options.checkExpirationInterval)

				cb && cb()

			})

		})

	},

	clearExpiredSessions: function() {

		var sql = 'SELECT `session_id` FROM `sessions` WHERE `expires` < ?'
		var params = [ Math.round(Date.now() / 1000) ]

		var self = this

		this.connection.query(sql, params, function(error, rows) {

			if (error)
			{
				if (self.options.debug)
				{
					console.log('Failed to get expired sessions:')
					console.log(error)
				}

				return

			}

			async.each(rows, function(row, nextRow) {

				self.destroy(row.session_id)
				nextRow()

			}, function() {})

		})

	},

	get: function(session_id, cb) {

		var sql = 'SELECT `data` FROM `sessions` WHERE `session_id` = ? LIMIT 1'
		var params = [ session_id ]

		this.connection.query(sql, params, function(error, rows) {

			if (error)
				return cb(error, null)

			var session = !!rows[0] ? JSON.parse(rows[0].data) : null

			cb(null, session)

		})

	},

	set: function(session_id, data, cb) {

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

	},

	destroy: function(session_id, cb) {

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

	},

	length: function(cb) {

		var sql = 'SELECT COUNT(*) FROM `sessions`'

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

	},

	clear: function(cb) {

		var sql = 'DELETE FROM `sessions`'

		this.connection.query(sql, function(error) {

			if (error)
				return cb && cb(error)

			cb && cb()

		})

	}

})

module.exports = SessionStore