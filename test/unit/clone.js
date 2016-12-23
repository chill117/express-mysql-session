'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var oracleDbStore = require('../..')(session);

describe('clone(object)', function() {

	it('should create a new instance (copy) of an object', function() {

		var original = {
			text: 'some text',
			someInt: 100
		};

		var cloned = oracleDbStore.prototype.clone(original);

		expect(cloned).to.deep.equal(original);

		// Change some values on the cloned object.
		cloned.someChange = 'a new entry';
		cloned.someInt = 202;

		expect(cloned).to.not.deep.equal(original);
	});
});
