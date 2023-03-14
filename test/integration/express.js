const assert = require('assert');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const session = require('express-session');
const manager = require('../manager');
const querystring = require('querystring');

describe('Express Integration', function() {

	[
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
		},
	].forEach((configuration, index) => {

		const hostname = 'localhost';
		const port = 3000 + index;

		describe(configuration.description, function() {

			let sessionStore;
			before(function() {
				sessionStore = manager.createInstance();
				return sessionStore.onReady();
			});

			let app;
			before(function(done) {
				let options = Object.assign({}, configuration.options, {
					host: hostname,
					port,
					store: sessionStore,
				});
				options.session = Object.assign({}, {
					key: `express.sid-${index}`,
					secret: 'some_secret',
					resave: false,
					saveUninitialized: true,
				}, options.session || {});
				app = express();
				app.use(session(options.session));
				app.server = app.listen(options.port, options.host, function() {
					done();
				});
				let sockets = {};
				let socketIncrement = 0;
				app.server.on('connection', socket => {
					const socketId = ++socketIncrement;
					sockets[socketId] = socket;
					socket.once('close', () => {
						delete sockets[socketId];
					});
				});
				const closeServer = app.server.close;
				app.server.close = function() {
					Object.values(sockets).forEach(socket => socket.destroy());
					closeServer.apply(this, arguments);
				};
				app.get('*', function(req, res) {
					const { bytes } = req.query;
					const sendResponse = function(error) {
						if (error) {
							res.status(500).json({ error: error.message });
						} else {
							res.status(200).json({ status: 'OK', session: req.session });
						}
					};
					if (bytes) {
						req.session.bytes = bytes;
						req.session.save(sendResponse);
					} else {
						sendResponse();
					}
				});
				app.options = options;
			});

			after(function() {
				app && app.server && app.server.close();
			});

			after(function() {
				if (sessionStore) return sessionStore.close();
			});

			[
				{
					description: 'with cookie - should persist session between requests',
					cookie: true,
				},
				{
					description: 'without cookie - should not persist session between requests',
					cookie: false,
				},
			].forEach(test => {
				it(test.description, function() {
					const bytes = crypto.randomBytes(16).toString('hex');
					return doGet({ bytes }).then(result => {
						const [ response, body ] = result;
						assert.strictEqual(response.statusCode, 200);
						assert.strictEqual(body.status, 'OK');
						assert.strictEqual(body.session.bytes, bytes);
						assert.ok(Array.isArray(response.headers['set-cookie']));
						const cookieJar = response.headers['set-cookie'];
						const sessionCookie = getSessionCookie(cookieJar, app.options.session.key);
						assert.notStrictEqual(sessionCookie, false);
						let headers = {};
						if (test.cookie) {
							headers['Cookie'] = cookieJar;
						}
						return doGet({}, headers).then(result2 => {
							const [ response2, body2 ] = result2;
							assert.strictEqual(response2.statusCode, 200);
							assert.strictEqual(body2.status, 'OK');
							if (test.cookie) {
								assert.strictEqual(typeof response2.headers['set-cookie'], 'undefined');
								assert.strictEqual(body2.session.bytes, bytes);
							} else {
								assert.notStrictEqual(typeof response2.headers['set-cookie'], 'undefined');
								assert.strictEqual(typeof body2.session.bytes, 'undefined');
							}
						});
					});
				});
			});
		});

		function doGet(params, headers) {
			return new Promise((resolve, reject) => {
				try {
					params = params || {};
					headers = headers || {};
					let options = {
						method: 'GET',
						hostname,
						port,
						path: '/?' + querystring.stringify(params),
						headers,
					};
					const req = http.request(options, response => {
						let body = '';
						response.on('data', buffer => body += buffer.toString());
						response.on('end', () => {
							if (response.headers['content-type'].substr(0, 'application/json'.length) === 'application/json') {
								try { body = JSON.parse(body); } catch (error) {
									return reject(error);
								}
							}
							resolve([ response, body ]);
						});
					});
					req.once('error', reject);
					req.end();
				} catch (error) {
					return reject(error);
				}
			});
		}
	});
});

function getSessionCookie(cookies, cookieName) {
	const sessionCookie = false;
	for (let i = 0; i < cookies.length; i++) {
		const parts = cookies[i].split(';');
		for (let n = 0; n < parts.length; n++) {
			parts[n] = parts[n].split('=');
			parts[n][0] = unescape(parts[n][0].trim().toLowerCase());
		}
		const name = parts[0][0];
		if (name === cookieName) {
			return cookies[i];
		}
	}
	return sessionCookie;
}
