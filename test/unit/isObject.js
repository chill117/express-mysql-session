'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var oracleDbStore = require('../..')(session);

describe('isObject(value)', function() {

	it('should return TRUE if value is an object', function() {

		expect(oracleDbStore.prototype.isObject({})).to.equal(true);
		expect(oracleDbStore.prototype.isObject({ someValue: 'test' })).to.equal(true);
	});

	it('should return FALSE if value is not an object', function() {

		expect(oracleDbStore.prototype.isObject(false)).to.equal(false);
		expect(oracleDbStore.prototype.isObject(1)).to.equal(false);
		expect(oracleDbStore.prototype.isObject(null)).to.equal(false);
		expect(oracleDbStore.prototype.isObject(undefined)).to.equal(false);
		expect(oracleDbStore.prototype.isObject('test')).to.equal(false);
	});
});
