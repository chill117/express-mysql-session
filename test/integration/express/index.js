'use strict';

var cookieParser = require('cookie-parser');
var expect = require('chai').expect;
var http = require('http');
var querystring = require('querystring');

var app = require('./app');
var TestManager = require('../../test-manager');

describe('Express Integration', function() {

	before(TestManager.tearDown);
	before(TestManager.setUp);
	after(TestManager.tearDown);

	describe('Sessions for a single client', function() {

		it('should persist between requests', function(done) {

			var cookieJar;

			var req = http.get({

				hostname: app.get('host'),
				port: app.get('port'),
				path: '/test'

			}, function(res) {

				expect(res.statusCode).to.equal(200);

				expect(res.headers['set-cookie']).to.be.an('array');

				var cookieJar = res.headers['set-cookie'];
				var sessionCookie = getSessionCookie(cookieJar);

				expect(sessionCookie).to.not.equal(false);

				var sessionId = getSessionId(sessionCookie);

				var req2 = http.get({

					hostname: app.get('host'),
					port: app.get('port'),
					path: '/test',
					headers: {
						'Cookie': cookieJar
					}

				}, function(res2) {

					expect(res2.statusCode).to.equal(200);
					expect(res2.headers['set-cookie']).to.equal(undefined);

					done();
				});

				req2.on('error', function(e) {

					done(new Error('Problem with request: ' + e.message));
				});
			});

			req.on('error', function(e) {

				done(new Error('Problem with request: ' + e.message));
			});
		});
	});

	describe('Sessions for different clients', function() {

		it('should not persist between requests', function(done) {

			var cookieJar;

			var req = http.get({

				hostname: app.get('host'),
				port: app.get('port'),
				path: '/test'

			}, function(res) {

				expect(res.statusCode).to.equal(200);

				expect(res.headers['set-cookie']).to.be.an('array');

				var cookieJar = res.headers['set-cookie'];
				var sessionCookie = getSessionCookie(cookieJar);

				expect(sessionCookie).to.not.equal(false);

				var sessionId = getSessionId(sessionCookie);

				var req2 = http.get({

					hostname: app.get('host'),
					port: app.get('port'),
					path: '/test'

					// Don't pass the cookie jar this time.

				}, function(res2) {

					expect(res2.statusCode).to.equal(200);
					expect(res2.headers['set-cookie']).to.not.equal(undefined);

					done();
				});

				req2.on('error', function(e) {

					done(new Error('Problem with request: ' + e.message));
				});
			});

			req.on('error', function(e) {

				done(new Error('Problem with request: ' + e.message));
			});
		});
	});
});

function getSessionCookie(cookies) {

	var sessionCookie = false;

	for (var i = 0; i < cookies.length; i++) {

		var parts = cookies[i].split(';');

		for (var n = 0; n < parts.length; n++) {
			parts[n] = parts[n].split('=');
			parts[n][0] = unescape(parts[n][0].trim().toLowerCase());
		}

		var name = parts[0][0];

		if (name == app.get('session_cookie_name')) {
			return cookies[i];
		}
	}

	return sessionCookie;
}

function getSessionId(cookieHeader) {

	var _cookieParser = cookieParser(app.get('session_cookie_secret'));

	var req = {
		headers: {
			cookie: cookieHeader
		}
	};

	var result;

	_cookieParser(req, {}, function(err) {

		if (err) {
			throw err;
		}

		result = req.signedCookies;
	});

	return result[app.get('session_cookie_name')];
}
