var async = require('async')
var chai = require('chai')
var expect = chai.expect

var SessionStore = require('../../index.js')
var sessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#sync(cb)', function() {

	before(TestManager.tearDown)

	describe('when the session database table does not yet exist', function() {

		after(TestManager.tearDown)

		it('should create it', function(done) {

			sessionStore.sync(function(error) {

				if (error)
					return done(new Error(error))

				var sql = 'SELECT `session_id`, `data`, `expires` FROM `sessions`'
				var params = []

				sessionStore.connection.query(sql, params, function(error, result) {

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

			sessionStore.sync(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

	})

	describe('when \'options.sync\' is set to FALSE', function() {

		var originalSync

		before(function() {

			originalSync = SessionStore.prototype.sync

		})

		after(function() {

			SessionStore.prototype.sync = originalSync

		})

		it('should not be called when a new sessionStore object is created', function(done) {

			var called = false

			SessionStore.prototype.sync = function() {

				called = true

				done(new Error('Sync method should not have been called'))

			}

			var options = require('../config/database.js')

			options.sync = false

			new SessionStore(options, function(error) {

				if (called)
					return

				if (error)
					return done(new Error(error))

				done()

			})

		})

	})

	describe('when \'options.sync\' is set to TRUE', function() {

		var originalSync

		before(function() {

			originalSync = SessionStore.prototype.sync

		})

		after(function() {

			SessionStore.prototype.sync = originalSync

		})

		it('should be called when a new sessionStore object is created', function(done) {

			var called = false

			SessionStore.prototype.sync = function(cb) {

				called = true

				cb && cb()

			}

			var options = require('../config/database.js')

			options.sync = true

			new SessionStore(options, function(error) {

				if (error)
					return done(new Error(error))

				if (!called)
					return done(new Error('Sync method should have been called'))

				done()

			})

		})

	})

})