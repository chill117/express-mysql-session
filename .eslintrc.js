module.exports = {
	'extends': 'eslint:recommended',
	"parserOptions": {
		"ecmaVersion": 6
	},
	"env": {
		"browser": false,
		"node": true,
		"mocha": true
	},
	'rules': {
		'indent': ['error', 'tab', { 'SwitchCase': 1 }],
		'no-console': 0,
		'no-undef': 2,
		'no-unused-vars': ['error', { 'vars': 'all', 'args': 'none' }]
	}
};
