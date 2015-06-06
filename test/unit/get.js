'use strict';

var async = require('async')
var chai = require('chai')
var expect = chai.expect

var sessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#get(session_id, cb)', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	after(TestManager.tearDown)

	var fixtures = require('../fixtures/sessions')

	describe('when a session exists', function() {

		before(TestManager.populateSessions)

		it('should return its session data', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id
				var data = fixture.data

				sessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null)
					expect(JSON.stringify(session)).to.equal(JSON.stringify(data))

					nextFixture()

				})

			}, done)

		})

	})

	describe('when a session does not exist', function() {

		before(TestManager.clearSessions)

		it('should return null', function(done) {

			async.each(fixtures, function(fixture, nextFixture) {

				var session_id = fixture.session_id
				var data = fixture.data

				sessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null)
					expect(session).to.equal(null)

					nextFixture()

				})

			}, done)

		})

	})

})