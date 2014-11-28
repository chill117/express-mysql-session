var async = require('async')
var chai = require('chai')
var expect = chai.expect

var SessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#sync(cb)', function() {

	before(TestManager.tearDown)

	describe('when the session database table does not yet exist', function() {

		after(TestManager.tearDown)

		it('should create it', function(done) {

			SessionStore.sync(function(error) {

				if (error)
					return done(new Error(error))

				var sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions`'
				var params = []

				SessionStore.connection.query(sql, params, function(error, result) {

					if (error)
						return done(new Error(error))

					done()

				})

			})

		})

	})

	describe('when the session database table does not yet exist', function() {

		before(TestManager.setUp)

		it('should do nothing', function(done) {

			SessionStore.sync(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

	})

})