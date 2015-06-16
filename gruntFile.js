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
		}
	};

	grunt.loadNpmTasks('grunt-jscs');

	grunt.initConfig(config);

};
