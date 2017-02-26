'use strict';

var _ = require('underscore');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expect = require('chai').expect;
var express = require('express');
var http = require('http');

var session = require('express-session');
var MySQLStore = require('../..')(session);

var manager = require('../manager');

var sessionStore = new MySQLStore({
	host: manager.config.host,
	port: manager.config.port,
	user: manager.config.user,
	password: manager.config.password,
	database: manager.config.database
});

describe('Express Integration', function() {

	before(manager.setUp);
	after(manager.tearDown);

	var configurations = [
		{
			description: '"resave" = FALSE',
			options: {
				session: {
					// With "resave" equal to FALSE, the session store will use the touch() method.
					resave: false
				}
			}
		},
		{
			description: '"cookie.maxAge" = NULL',
			options: {
				session: {
					cookie: {
						maxAge: null
					}
				}
			}
		}
	];

	_.each(configurations, function(configuration) {

		describe(configuration.description, function() {

			var app;

			before(function() {
				app = createAppServer(configuration.options);
			});

			after(function() {
				app.server.close();
			});

			describe('Sessions for a single client', function() {

				it('should persist between requests', function(done) {

					var req = http.get({

						hostname: app.options.host,
						port: app.options.port,
						path: '/test'

					}, function(res) {

						expect(res.statusCode).to.equal(200);

						expect(res.headers['set-cookie']).to.be.an('array');

						var cookieJar = res.headers['set-cookie'];
						var sessionCookie = getSessionCookie(cookieJar, app.options.session.key);

						expect(sessionCookie).to.not.equal(false);

						var req2 = http.get({

							hostname: app.options.host,
							port: app.options.port,
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

					var req = http.get({

						hostname: app.options.host,
						port: app.options.port,
						path: '/test'

					}, function(res) {

						expect(res.statusCode).to.equal(200);

						expect(res.headers['set-cookie']).to.be.an('array');

						var cookieJar = res.headers['set-cookie'];
						var sessionCookie = getSessionCookie(cookieJar, app.options.session.key);

						expect(sessionCookie).to.not.equal(false);

						var req2 = http.get({

							hostname: app.options.host,
							port: app.options.port,
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
	});
});

function getSessionCookie(cookies, cookieName) {

	var sessionCookie = false;

	for (var i = 0; i < cookies.length; i++) {

		var parts = cookies[i].split(';');

		for (var n = 0; n < parts.length; n++) {
			parts[n] = parts[n].split('=');
			parts[n][0] = unescape(parts[n][0].trim().toLowerCase());
		}

		var name = parts[0][0];

		if (name == cookieName) {
			return cookies[i];
		}
	}

	return sessionCookie;
}

var appServerPort = 3000;

function createAppServer(options) {

	options = _.defaults(options || {}, {
		host: 'localhost',
		port: appServerPort++
	});

	options.session = _.defaults(options.session || {}, {
		key: 'express.sid',
		secret: 'some_secret',
		resave: false,
		saveUninitialized: false
	});

	var app = express();

	app.use(cookieParser());

	app.use(bodyParser.json());

	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(session(_.extend(options.session || {}, {
		store: sessionStore
	})));

	app.server = app.listen(options.port, options.host);

	app.get('/test', function(req, res) {

		res.status(200).json('hi!');
	});

	app.options = options;

	return app;
}
