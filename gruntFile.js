'use strict';

module.exports = function(grunt) {

	var config = {

		jscs: {
			src: [
				'lib/*.js',
				'test/**/*.js',
				'gruntFile.js',
				'index.js'
			],
			options: {
				config: '.jscsrc',
				requireCurlyBraces: [ 'if', 'for', 'while' ]
			}
		},
		mochaTest: {
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
		}
	};

	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-mocha-test');

	grunt.initConfig(config);

	grunt.registerTask('test:unit', [ 'mochaTest:unit' ]);
	grunt.registerTask('test:integration', [ 'mochaTest:integration' ]);
	grunt.registerTask('test:code-style', [ 'jscs' ]);
	grunt.registerTask('test', [ 'test:unit', 'test:integration', 'test:code-style' ]);
};
