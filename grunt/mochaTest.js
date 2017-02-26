'use strict';

module.exports = {
	benchmarks: {
		options: {
			reporter: 'spec',
			ui: 'bdd'
		},
		src: ['test/benchmarks/**/*.js']
	},
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
