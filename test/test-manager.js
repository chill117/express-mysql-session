var async = require('async')
var fs = require('fs')

var SessionStore = require('./session-store')

module.exports = {

	setUp: function(done) {

		var sql = fs.readFileSync(__dirname + '/../schema.sql', 'utf-8')

		SessionStore.connection.query(sql, function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	},

	tearDown: function(done) {

		var sql = 'DROP TABLE IF EXISTS `sessions`'

		SessionStore.connection.query(sql, function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	},

	populateSessions: function(done) {

		var fixtures = require('./fixtures/sessions')

		async.each(fixtures, function(fixture, nextFixture) {

			var session_id = fixture.session_id
			var data = fixture.data

			SessionStore.set(session_id, data, nextFixture)

		}, function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	},

	clearSessions: function(done) {

		SessionStore.clear(function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	}

}