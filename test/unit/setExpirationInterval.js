'use strict';

var async = require('async');

var manager = require('../manager');

describe('setExpirationInterval(interval)', function() {

	before(manager.setUp);

	var sessionStore;
	beforeEach(function(done) {
		sessionStore = manager.createInstance(done);
	});

	after(manager.tearDown);

	describe('constructor option: "createDatabaseTable"', function() {

		it('should be called when FALSE', function(done) {

			var intervalTime = 20;
			var called = false;

			// Override the clearExpiredSessions method.
			sessionStore.clearExpiredSessions = function() {
				called = true;
			};

			sessionStore.setExpirationInterval(intervalTime);

			async.until(function() { return called; }, function(next) {
				setTimeout(next, 5);
			}, done);
		});
	});

	it('should correctly set the check expiration interval time', function(done) {

		var numCalls = 0;
		var intervalTime = 14;

		// Override the clearExpiredSessions method.
		sessionStore.clearExpiredSessions = function() {
			numCalls++;
		};

		sessionStore.setExpirationInterval(intervalTime);

		// Timeouts will never execute before the time given.
		// But they are not 100% guaranteed to execute exactly when you would expect.

		var startTime = Date.now();
		setTimeout(function() {
			async.until(function() {
				return numCalls >= Math.floor((startTime - Date.now()) / intervalTime);
			}, function(next) {
				setTimeout(next, 5);
			}, done);
		}, intervalTime * 3);
	});
});
