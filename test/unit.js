var chai = require('chai')
var expect = chai.expect
var fs = require('fs')
var _ = require('underscore')

describe('', function() {

	var fixtures = JSON.parse(fs.readFileSync(__dirname + '/fixtures/sessions.json'))

	var SessionStore = require('./lib/session_store.js')
	
	before(function(done) {

		// Clear any existing sessions.
		SessionStore.clear(function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	})

	after(function(done) {

		// Clear any sessions that were created during the tests.
		SessionStore.clear(function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	})

	describe('get()', function() {

		// Create all the session fixtures.
		for (var i in fixtures)
			(function(fixture) {
				before(function(done) {

					var session_id = fixture.session_id
					var data = fixture.data

					SessionStore.set(session_id, data, function(error) {

						if (error)
							return done(new Error(error))

						done()

					})

				})
			})(fixtures[i])

		after(function(done) {

			// Clear the sessions that were created for this group of tests.
			SessionStore.clear(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

		describe(', when a session exists,', function() {

			var session_id = fixtures[2].session_id
			var data = fixtures[2].data

			it('should return its session data', function(done) {

				SessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null)
					expect(JSON.stringify(session)).to.equal(JSON.stringify(data))

					done()

				})

			})

		})

		describe(', when a session does not exist,', function() {

			var session_id = fixtures[2].session_id
			var data = fixtures[2].data

			before(function(done) {

				// Delete the session before attempting to retrieve it.
				SessionStore.destroy(session_id, function(error) {

					if (error)
						return done(new Error(error))

					done()

				})

			})

			it('should return null', function(done) {

				SessionStore.get(session_id, function(error, session) {

					expect(error).to.equal(null)
					expect(session).to.equal(null)

					done()

				})

			})

		})

	})

	describe('set()', function() {

		describe(', when the session does not exist yet,', function() {

			var session_id = fixtures[0].session_id
			var data = fixtures[0].data

			before(function(done) {

				// Make sure it doesn't exist yet.
				SessionStore.destroy(session_id, function(error) {

					if (error)
						return done(new Error(error))

					done()

				})

			})

			it('should create a new session', function(done) {

				SessionStore.set(session_id, data, function(error) {

					expect(error).to.equal(undefined)

					SessionStore.get(session_id, function(error, session) {

						expect(error).to.equal(null)
						expect(JSON.stringify(session)).to.equal(JSON.stringify(data))

						done()

					})

				})

			})

		})

		describe(', when the session already exists,', function() {

			var session_id = fixtures[1].session_id
			var data = fixtures[1].data

			before(function(done) {

				// Make sure the session exists.
				SessionStore.set(session_id, data, function(error) {

					if (error)
						return done(new Error(error))

					done()

				})

			})

			it('should update the existing session with the new data', function(done) {

				var changedData = _.clone(data)

				changedData.new_attr = 'an additional data attribute'

				SessionStore.set(session_id, changedData, function(error) {

					expect(error).to.equal(undefined)

					SessionStore.get(session_id, function(error, session) {

						expect(error).to.equal(null)
						expect(JSON.stringify(session)).to.equal(JSON.stringify(changedData))

						done()

					})

				})

			})

		})

	})

	describe('destroy()', function() {

		var session_id = fixtures[1].session_id
		var data = fixtures[1].data

		before(function(done) {

			// Create a session fixture.
			SessionStore.set(session_id, data, function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

		describe(', when the session exists,', function() {

			it('should delete the session', function(done) {

				SessionStore.destroy(session_id, function(error) {

					expect(error).to.equal(undefined)

					SessionStore.get(session_id, function(error, session) {

						expect(error).to.equal(null)
						expect(session).to.equal(null)

						done()

					})

				})

			})

		})

		describe(', when the session does not exist,', function() {

			it('should do nothing', function(done) {

				SessionStore.destroy(session_id, function(error) {

					expect(error).to.equal(undefined)

					done()

				})

			})

		})

	})

	describe('length()', function() {

		before(function(done) {

			// Clear any existing sessions.
			SessionStore.clear(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

		after(function(done) {

			// Clear the sessions that were created for this group of tests.
			SessionStore.clear(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

		// Create all the session fixtures.
		for (var i in fixtures)
			(function(fixture) {
				before(function(done) {

					var session_id = fixture.session_id
					var data = fixture.data

					SessionStore.set(session_id, data, function(error) {

						if (error)
							return done(new Error(error))

						done()

					})

				})
			})(fixtures[i])

		it('should give an accurate count of the total number of sessions', function(done) {

			SessionStore.length(function(count) {

				expect(count).to.not.equal(null)
				expect(count).to.equal(fixtures.length)

				done()

			})

		})

	})

	describe('clear()', function() {

		// Create all the session fixtures.
		for (var i in fixtures)
			(function(fixture) {
				before(function(done) {

					var session_id = fixture.session_id
					var data = fixture.data

					SessionStore.set(session_id, data, function(error) {

						if (error)
							return done(new Error(error))

						done()

					})

				})
			})(fixtures[i])

		it('should delete all existing sessions', function(done) {

			SessionStore.clear(function(error) {

				expect(error).to.equal(undefined)

				SessionStore.length(function(count) {

					expect(count).to.not.equal(null)
					expect(count).to.equal(0)

					done()

				})

			})

		})

	})

})