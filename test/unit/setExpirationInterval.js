'use strict';

var expect = require('chai').expect;

var manager = require('../manager');
var config = manager.config;
var sessionStore = manager.sessionStore;
var MysqlStore = manager.MysqlStore;

describe('setExpirationInterval(interval)', function() {

	before(manager.setUp);
	after(manager.tearDown);

	var originalMethods = {};

	before(function() {

		originalMethods['clearExpiredSessions'] = sessionStore.clearExpiredSessions;
	});

	afterEach(function() {

		// Restore original methods on the sessionStore object.
		for (var name in originalMethods) {
			sessionStore[name] = originalMethods[name];
		}

		sessionStore.clearExpirationInterval();
	});

	it('should be called when \'createDatabaseTable\' option is set to FALSE', function(done) {

		var checkExpirationInterval = 45;

		var sessionStore = new MysqlStore({
			host: config.host,
			port: config.port,
			user: config.user,
			password: config.password,
			database: config.database,
			checkExpirationInterval: checkExpirationInterval,
			createDatabaseTable: false
		});

		var called = false;

		// Override the clearExpiredSessions method.
		sessionStore.clearExpiredSessions = function() {

			called = true;
		};

		setTimeout(function() {

			expect(called).to.equal(true);

			done();

		}, checkExpirationInterval + 30);
	});

	it('should correctly set the check expiration interval time', function(done) {

		var numCalls = 0;
		var numCallsExpected = 5;
		var intervalTime = 14;
		var paddingTime = (intervalTime * 1.5);

		// Override the clearExpiredSessions method.
		sessionStore.clearExpiredSessions = function() {

			numCalls++;
		};

		sessionStore.setExpirationInterval(intervalTime);

		// Timeouts will never execute before the time given.
		// But they are not 100% guaranteed to execute exactly when you would expect.
		setTimeout(function() {

			expect(numCalls >= numCallsExpected).to.equal(true);

			done();

		}, (intervalTime * numCallsExpected) + paddingTime);

	});
});
