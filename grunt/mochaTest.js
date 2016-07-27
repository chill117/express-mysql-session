'use strict';

module.exports = {
	unit: {
		options: {
			reporter: 'spec'
		},
		src: ['test/unit/**/*.js']
	},
	integration: {
		options: {
			reporter: 'spec'
		},
		src: ['test/integration/**/*.js']
	}
};
