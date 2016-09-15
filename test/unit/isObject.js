'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var MySQLStore = require('../..')(session);

describe('isObject(value)', function() {

	it('should return TRUE if value is an object', function() {

		expect(MySQLStore.prototype.isObject({})).to.equal(true);
		expect(MySQLStore.prototype.isObject({ someValue: 'test' })).to.equal(true);
	});

	it('should return FALSE if value is not an object', function() {

		expect(MySQLStore.prototype.isObject(false)).to.equal(false);
		expect(MySQLStore.prototype.isObject(1)).to.equal(false);
		expect(MySQLStore.prototype.isObject(null)).to.equal(false);
		expect(MySQLStore.prototype.isObject(undefined)).to.equal(false);
		expect(MySQLStore.prototype.isObject('test')).to.equal(false);
	});
});
