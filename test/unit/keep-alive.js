var chai = require('chai')
var expect = chai.expect

var SessionStore = require('../session-store.js')

describe('SessionStore#', function() {

	describe('setKeepAliveInterval(interval)', function() {

		after(function() {

			SessionStore.clearKeepAliveInterval()

		})

		it('should correclty set the keep-alive interval time', function(done) {

			var numCalls = 0, intervalTime = 24

			// Override the keepAlive method.
			SessionStore.keepAlive = function() {

				numCalls++

			}

			SessionStore.setKeepAliveInterval(intervalTime)

			var testTime = (intervalTime * 5) + 10

			setTimeout(function() {

				var numCallsExpected = Math.floor(testTime / intervalTime)

				expect(numCalls).to.equal(numCallsExpected)

				done()

			}, testTime)

		})

	})

	describe('keepAlive()', function() {

		it('should be able to manually send a keep-alive signal', function(done) {

			try {

				SessionStore.keepAlive()

			} catch (error) {

				if (error)
					return done(new Error(error))

			}

			done()

		})

	})

})