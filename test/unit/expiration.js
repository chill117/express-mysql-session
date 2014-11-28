var chai = require('chai')
var expect = chai.expect

var sessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	after(TestManager.tearDown)

	describe('clearExpiredSessions(cb)', function() {

		var fixtures = require('../fixtures/sessions')
		var num_expired = fixtures.length - 2

		before(TestManager.populateSessions)

		before(function(done) {

			// Change some of the sessions' expires time.

			var expiration = sessionStore.options.expiration

			var sql = 'UPDATE `sessions` SET expires = ? LIMIT ' + num_expired
			var expires = ( new Date( Date.now() - (expiration + 15000) ) ) / 1000
			var params = [ expires ]

			sessionStore.connection.query(sql, params, function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

		after(TestManager.clearSessions)

		it('should clear expired sessions', function(done) {

			sessionStore.clearExpiredSessions(function(error) {

				if (error)
					return done(new Error(error))

				sessionStore.length(function(error, count) {

					if (error)
						return done(new Error(error))

					expect(count).to.equal(fixtures.length - num_expired)

					done()

				})

			})

		})

	})

	describe('setExpirationInterval(interval)', function() {

		var originalClearExpiredSessionsMethod

		before(function() {

			originalClearExpiredSessionsMethod = sessionStore.clearExpiredSessions

		})

		after(function() {

			sessionStore.clearExpirationInterval()

		})

		after(function() {

			sessionStore.clearExpiredSessions = originalClearExpiredSessionsMethod

		})

		it('should correctly set the check expiration interval time', function(done) {

			var numCalls = 0, intervalTime = 24

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {

				numCalls++

			}

			sessionStore.setExpirationInterval(intervalTime)

			var testTime = (intervalTime * 5) + 10

			setTimeout(function() {

				var numCallsExpected = Math.floor(testTime / intervalTime)

				expect(numCalls).to.equal(numCallsExpected)

				done()

			}, testTime)

		})
		
	})

})