'use strict';

var expect = require('chai').expect;
var session = require('express-session');
var MySQLStore = require('../..')(session);

describe('defaults(object, defaultValues[, options])', function() {

	it('should return a clone of the object with the default values filled in', function() {

		var object = {
			someValue: 'test'
		};

		var defaultValues = {
			anotherValue: 'some new value'
		};

		var defaulted = MySQLStore.prototype.defaults(object, defaultValues);

		for (var key in defaultValues) {
			expect(defaulted[key]).to.equal(defaultValues[key]);
		}

		expect(defaulted).to.not.deep.equal(object);
	});

	it('"recursive" option', function() {

		var object = {};

		var defaultValues = {
			nested: {
				test: 'hi there!'
			}
		};

		var defaulted = MySQLStore.prototype.defaults(object, defaultValues);

		for (var key in defaultValues) {
			expect(defaulted[key]).to.deep.equal(defaultValues[key]);
		}

		expect(defaulted).to.not.deep.equal(object);
	});
});
