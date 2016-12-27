'use strict';

module.exports = {
	unit: {
		options: {
			reporter: 'spec',
			timeout: 30000
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
