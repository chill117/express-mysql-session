'use strict';

var expect = require('chai').expect

var sessionStore = require('../session-store')
var TestManager = require('../test-manager')

describe('SessionStore#clear(cb)', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	after(TestManager.tearDown)

	describe('when sessions exist', function() {

		before(TestManager.populateSessions)

		it('should delete all existing sessions', function(done) {

			sessionStore.clear(function(error) {

				expect(error).to.equal(undefined)

				sessionStore.length(function(error, count) {

					expect(error).to.equal(null)
					expect(count).to.equal(0)
					done()

				})

			})

		})

	})

})