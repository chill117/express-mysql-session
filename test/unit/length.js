'use strict';

var async = require('async')
var chai = require('chai')
var expect = chai.expect

var sessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#length(cb)', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	after(TestManager.tearDown)

	var fixtures = require('../fixtures/sessions')

	it('should give an accurate count of the total number of sessions', function(done) {

		var num_sessions = 0

		async.eachSeries(fixtures, function(fixture, nextFixture) {

			var session_id = fixture.session_id
			var data = fixture.data

			sessionStore.set(session_id, data, function(error) {

				if (error)
					return nextFixture(new Error(error))

				num_sessions++

				sessionStore.length(function(error, count) {

					expect(error).to.equal(null)
					expect(count).to.equal(num_sessions)

					nextFixture()

				})

			})

		}, done)

	})

})