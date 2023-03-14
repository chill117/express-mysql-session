const assert = require('assert');
const manager = require('../../manager');

describe('JSON data column', function() {

	// Yes, tear-down only.
	before(manager.tearDown);

	let sessionStore;
	before(function() {
		sessionStore = manager.createInstance({
			createDatabaseTable: false,
			jsonData: true,
		});
		return sessionStore.onReady();
	});

	before(function() {
		const sql = [
			'CREATE TABLE IF NOT EXISTS `sessions` (',
			'  `session_id` varchar(128) COLLATE utf8mb4_bin NOT NULL,',
			'  `expires` int(11) unsigned NOT NULL,',
			'  `data` json,',
			'  PRIMARY KEY (`session_id`)',
			') ENGINE=InnoDB',
		].join('\n');
		return sessionStore.connection.query(sql);
	});

	let session_id;
	let data;
	before(function() {
		const fixture = manager.fixtures.sessions[0] || null;
		session_id = fixture.session_id;
		data = fixture.data;
		return sessionStore.set(session_id, data);
	});

	after(function() {
		if (sessionStore) return sessionStore.close();
	});

	it('get', function() {
		return sessionStore.get(session_id).then(session => {
			assert.deepStrictEqual(session, data);
		});
	});

	it('set', function() {
		return sessionStore.set(session_id, data).then(() => {
			return sessionStore.get(session_id).then(session => {
				assert.deepStrictEqual(session, data);
			});
		});
	});

	it('all', function() {
		return sessionStore.all().then(sessions => {
			assert.deepStrictEqual(sessions[session_id], data);
		});
	});
});
