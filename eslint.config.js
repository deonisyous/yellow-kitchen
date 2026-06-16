import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	prettierConfig,
	{
		files: ['src/js/**/*.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
			},
		},
		rules: {
			'no-unused-vars': 'warn',
			'no-console': 'off',
		},
	},
	{
		files: ['gulp/**/*.js', 'gulpfile.js', 'webpack.config.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			},
		},
		rules: {
			'no-undef': 'warn',
		},
	},
];
