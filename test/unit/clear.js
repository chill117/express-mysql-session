var _ = require('underscore')
var async = require('async')
var chai = require('chai')
var expect = chai.expect
var mysql = require('mysql')

var SessionStore = require('../session-store.js')
var TestManager = require('../test-manager.js')

describe('SessionStore#clear(cb)', function() {

	before(TestManager.tearDown)
	before(TestManager.setUp)
	before(TestManager.populateSessions)
	after(TestManager.tearDown)

	it('should delete all existing sessions', function(done) {

		SessionStore.clear(function(error) {

			expect(error).to.equal(undefined)

			SessionStore.length(function(error, count) {

				expect(error).to.equal(null)
				expect(count).to.equal(0)
				done()

			})

		})

	})

})