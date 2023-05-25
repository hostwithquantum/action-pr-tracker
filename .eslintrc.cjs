module.exports = {
	env: {
		browser: false,
		node: true,
	},
	extends: 'eslint:recommended',
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	ignorePatterns: ['dist/**'],
	rules: {
		'comma-dangle': [1, 'always-multiline'],
		'max-len': [1, { code: 150 }],
	},
}
