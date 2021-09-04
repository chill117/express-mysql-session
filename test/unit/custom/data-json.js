'use strict';

var _ = require('underscore');
var expect = require('chai').expect;

var manager = require('../../manager');

describe('JSON data column', function() {

	// Yes, tear-down only.
	before(manager.tearDown);

	var sessionStore;
	before(function(done) {
		sessionStore = manager.createInstance({
			createDatabaseTable: false,
			jsonData: true,
		}, done);
	});

	before(function(done) {
		var sql = [
			'CREATE TABLE IF NOT EXISTS `sessions` (',
			'  `session_id` varchar(128) COLLATE utf8mb4_bin NOT NULL,',
			'  `expires` int(11) unsigned NOT NULL,',
			'  `data` json,',
			'  PRIMARY KEY (`session_id`)',
			') ENGINE=InnoDB',
		].join('\n');
		sessionStore.connection.query(sql, done);
	});

	var session_id;
	var data;
	before(function(done) {
		var fixture = _.first(manager.fixtures.sessions);
		session_id = fixture.session_id;
		data = fixture.data;
		sessionStore.set(session_id, data, done);
	});

	after(function(done) {
		if (!sessionStore) return done();
		sessionStore.close(done);
	});

	it('get', function(done) {
		sessionStore.get(session_id, function(error, session) {
			if (error) return done(error);
			expect(session).to.deep.equal(data);
			done();
		});
	});

	it('set', function(done) {
		sessionStore.set(session_id, data, function(error) {
			if (error) return done(error);
			sessionStore.get(session_id, function(error, session) {
				if (error) return done(error);
				expect(session).to.deep.equal(data);
				done();
			});
		});
	});

	it('all', function(done) {
		sessionStore.all(function(error, sessions) {
			if (error) return done(error);
			expect(sessions[session_id]).to.deep.equal(data);
			done();
		});
	});
});