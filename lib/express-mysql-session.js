var sequelize = DataTypes = require('sequelize-mysql').sequelize
var _ = require('underscore')

module.exports = function(options, express) {

	express || (express = require('express'))

	var defaultOptions = {

		db: {},
		debug: true,
		forceSync: false,
		checkExpirationInterval: 900000,// 15 Minutes
		expiration: 86400000// 1 Day
	}

	function SessionStore() {

		this.options = _.extend(defaultOptions, options) || defaultOptions

		express.session.Store.call(this, this.options)

		this.initialize()

	}

	_.extend(SessionStore.prototype, {

		initialize: function() {

			var self = this
			var db = this.options.db

			this.Sequelize = new sequelize(db.name, db.user, db.pass, db.options || {})

			this.SessionModel = require(__dirname + '/../models/Session')(this.Sequelize, DataTypes)

			this.sync(function(error) {

				if (error)
				{
					if (self.options.debug)
					{
						console.log('Failed to initialize SessionStore')
						console.log(error)
					}

					return
				}

				self.startExpiredSessionsCheckTimer

			})

		},

		sync: function(cb) {

			this.Sequelize
					.sync({force: this.options.forceSync})
						.success(function() {

							cb(null)

						})
						.error(cb)

		},

		startExpiredSessionsCheckTimer: function() {

			var interval = this.options.checkExpirationInterval

			setTimeout(this.clearExpiredSessions, interval)
			setTimeout(this.startExpiredSessionsCheckTimer, interval)

		},

		clearExpiredSessions: function() {

			var self = this

			this.SessionModel
				.findAll({where: ['expires < ?', Math.round(Date.now() / 1000)]})
					.success(function(sessions) {
						
						if (sessions.length > 0)
							for (var i in sessions)
								sessions[i].destroy()

					})
					.error(function(error) {

						if (self.options.debug)
						{
							console.log('Failed to get expired sessions:')
							console.log(error)
						}

					})

		},

		get: function(session_id, cb) {

			this.SessionModel
				.find({
					where: {session_id: session_id},
					limit: 1
				})
					.success(function(result) {

						var session = result && JSON.parse(result.json)

						cb(null, session)

					})
					.error(function(error) {

						cb(error, null)
						
					})

		},

		set: function(session_id, data, cb) {

			var self = this

			this.SessionModel
				.find({
					where: {session_id: session_id},
					limit: 1
				})
					.success(function(session) {

						if (!session)
							session = self.SessionModel.build({session_id: session_id})

						session.json = JSON.stringify(data)

						var expires = data.cookie.expires || new Date(Date.now() + self.options.expiration)

						// Note: JS uses milliseconds, but we want integer seconds.
						session.expires = Math.round(expires.getTime() / 1000)
						
						session.save()
							.success(function() {

								cb && cb()

							})
							.error(function(error) {

								cb && cb(error)

							})

					})
					.error(function(error) {

						cb && cb(error)

					})

		},

		destroy: function(session_id, cb) {

			var self = this

			this.SessionModel
				.find({
					where: {session_id: session_id},
					limit: 1
				})
					.success(function(session) {

						if (!session)
						{
							fn && fn()

							return
						}

						session.destroy()
							.success(function() {

								fn && fn()

							})
							.error(function(error) {

								if (self.options.debug)
								{
									console.log('Session ' + session_id + ' could not be destroyed:')
									console.log(error)
								}

								fn && fn(error)

							})

					})
					.error(function(error) {

						fn && fn(error)

					})
		},

		length: function(cb) {

			this.SessionModel
				.count()
					.success(cb)
					.error(function() {

						cb(null)

					})

		},

		clear: function(cb) {

			this.Sequelize.sync({force: true})
				.success(function() {
					
					cb && cb()

				})
				.error(function(error) {

					cb && cb(error)

				})

		}

	})
    
    SessionStore.prototype.__proto__ = express.session.Store.prototype;
	
	return new SessionStore()
}