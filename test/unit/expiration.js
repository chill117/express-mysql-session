var async = require('async')
var chai = require('chai')
var expect = chai.expect

var SessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

var connection = SessionStore.connection

describe('SessionStore#clearExpiredSessions(cb)', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	after(TestManager.tearDown)

	var fixtures = require('../fixtures/sessions')

	describe('when there are some expired sessions', function() {

		var num_expired = (fixtures.length - 2)

		before(TestManager.populateSessions)
		before(function(done) { setSomeSessionsAsExpired(num_expired, done) })
		after(TestManager.clearSessions)

		it('should clear only the expired sessions', function(done) {

			SessionStore.clearExpiredSessions(function(error) {

				if (error)
					return done(new Error(error))

				SessionStore.length(function(error, count) {

					expect(count).to.equal(fixtures.length - num_expired)

					done()

				})

			})

		})

	})

	describe(', when sessions exist,', function() {

		it('should be called at regular intervals automatically', function(done) {

			var intervalTimes = [100, 200]

			var expectedTestDuration = 250

			for (var i in intervalTimes)
				expectedTestDuration += (intervalTimes[i] * fixtures.length)

			this.timeout(expectedTestDuration)

			async.eachSeries(intervalTimes, function(intervalTime, nextIntervalTime) {

				TestManager.populateSessions(function(error) {

					if (error)
						return nextIntervalTime(error)

					var interval

					SessionStore.setExpirationInterval(intervalTime)

					setTimeout(function() {

						var num_expired = 1

						setSomeSessionsAsExpired(1)

						interval = setInterval(function() {

							SessionStore.length(function(error, count) {

								expect(count).to.equal(fixtures.length - num_expired)

								if (num_expired == fixtures.length)
								{
									clearInterval(interval)
									return nextIntervalTime()
								}

								setSomeSessionsAsExpired(1)
								num_expired++

							})

						}, intervalTime)

					}, 50)

				})

			}, done)

		})

	})

})

function setSomeSessionsAsExpired(num_expired, cb) {

	// Change some of the sessions' expires time.

	var expiration = SessionStore.options.expiration

	var sql = 'UPDATE `sessions` SET expires = ? LIMIT ' + num_expired
	var expires = ( new Date( Date.now() - (expiration + 15000) ) ) / 1000
	var params = [ expires ]

	connection.query(sql, params, function(error) {

		if (error)
			return cb && cb(new Error(error))

		cb && cb()

	})

}