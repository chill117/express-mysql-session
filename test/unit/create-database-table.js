'use strict';

var SessionStore = require('../../index.js')
var sessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#createDatabaseTable(cb)', function() {

	before(TestManager.tearDown)

	describe('when the session database table does not yet exist', function() {

		after(TestManager.tearDown)

		it('should create it', function(done) {

			sessionStore.createDatabaseTable(function(error) {

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

			sessionStore.createDatabaseTable(function(error) {

				if (error)
					return done(new Error(error))

				done()

			})

		})

	})

	describe('when \'options.createDatabaseTable\' is set to FALSE', function() {

		var originalSync

		before(function() {

			originalSync = SessionStore.prototype.createDatabaseTable

		})

		after(function() {

			SessionStore.prototype.createDatabaseTable = originalSync

		})

		it('should not be called when a new sessionStore object is created', function(done) {

			var called = false

			SessionStore.prototype.createDatabaseTable = function() {

				called = true

				done(new Error('Sync method should not have been called'))

			}

			var options = require('../config/database.js')

			options.createDatabaseTable = false

			new SessionStore(options, function(error) {

				if (called)
					return

				if (error)
					return done(new Error(error))

				done()

			})

		})

	})

	describe('when \'options.createDatabaseTable\' is set to TRUE', function() {

		var originalSync

		before(function() {

			originalSync = SessionStore.prototype.createDatabaseTable

		})

		after(function() {

			SessionStore.prototype.createDatabaseTable = originalSync

		})

		it('should be called when a new sessionStore object is created', function(done) {

			var called = false

			SessionStore.prototype.createDatabaseTable = function(cb) {

				called = true

				cb && cb()

			}

			var options = require('../config/database.js')

			options.createDatabaseTable = true

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