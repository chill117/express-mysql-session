var app = require('./lib/app.js')
var config = require('./config/config.js')
var db_config = require('./config/db.js')

var chai = require('chai')
var expect = chai.expect
var http = require('http')
var querystring = require('querystring')

var cookies = require('./lib/cookies.js').init()

describe('', function() {

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

		// Clear the sessions that were created during the tests.
		SessionStore.clear(function(error) {

			if (error)
				return done(new Error(error))

			done()

		})

	})

	describe('Sessions for a single client', function() {

		it('should persist between requests', function(done) {

			var cookieJar

			var req = http.get({

				hostname: config.host,
				port: config.port,
				path: '/test'

			}, function(res) {

				expect(res.statusCode).to.equal(200)

				expect(res.headers['set-cookie']).to.be.an('array')

				var cookieJar = res.headers['set-cookie']
				var sessionCookie = cookies.getSessionCookie(cookieJar)

				expect(sessionCookie).to.not.equal(false)

				var sessionId = cookies.getSessionId(sessionCookie)

				var req2 = http.get({

					hostname: config.host,
					port: config.port,
					path: '/test',
					headers: {
						'Cookie': cookieJar
					}

				}, function(res2) {

					expect(res2.statusCode).to.equal(200)
					expect(res2.headers['set-cookie']).to.equal(undefined)

					done()

				})

				req2.on('error', function(e) {

					done(new Error('Problem with request: ' + e.message))

				})

			})

			req.on('error', function(e) {

				done(new Error('Problem with request: ' + e.message))

			})

		})

	})

	describe('Sessions for different clients', function() {

		it('should not persist between requests', function(done) {

			var cookieJar

			var req = http.get({

				hostname: config.host,
				port: config.port,
				path: '/test'

			}, function(res) {

				expect(res.statusCode).to.equal(200)

				expect(res.headers['set-cookie']).to.be.an('array')

				var cookieJar = res.headers['set-cookie']
				var sessionCookie = cookies.getSessionCookie(cookieJar)

				expect(sessionCookie).to.not.equal(false)

				var sessionId = cookies.getSessionId(sessionCookie)

				var req2 = http.get({

					hostname: config.host,
					port: config.port,
					path: '/test'

					// Don't pass the cookie jar this time.

				}, function(res2) {

					expect(res2.statusCode).to.equal(200)
					expect(res2.headers['set-cookie']).to.not.equal(undefined)

					done()

				})

				req2.on('error', function(e) {

					done(new Error('Problem with request: ' + e.message))

				})

			})

			req.on('error', function(e) {

				done(new Error('Problem with request: ' + e.message))

			})

		})

	})

})