'use strict';

var _ = require('underscore');
var Benchmark = require('benchmark');
var manager = require('../manager');

describe('benchmark: touch', function() {

	var sessionStore;

	before(function(done) {

		manager.setUp(function(error, store) {

			if (error) {
				return done(error);
			}

			sessionStore = store;
			done();
		});
	});

	var numSessions = 1000000;
	var sessionIdPrefix = 'benchmarking-session-id-';

	before(function(done) {

		this.timeout(60000);
		manager.populateManySessions(numSessions, sessionIdPrefix, done);
	});

	after(manager.tearDown);

	it('touch()', function(done) {

		this.timeout(15000);

		var bench = new Benchmark(function(deferred) {
			sessionStore.touch(sessionIdPrefix + _.random(numSessions), {}/* session object */, function() {
				deferred.resolve();
			});
		}, { defer: true });

		bench.on('complete', function(result) {

			if (result.target.error) {
				return done(result.target.error);
			}

			console.log(result.target.toString());
			done();
		});

		bench.run();
	});
});
