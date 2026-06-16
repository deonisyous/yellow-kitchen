const config = {
	entry: {
		index: './src/js/index.js',
		// contacts: './src/js/contacts.js',
		// about: './src/js/about.js',
	},
	output: {
		filename: '[name].bundle.js',
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						cacheDirectory: true,
						presets: [
							[
								'@babel/preset-env',
								{
									bugfixes: true,
									modules: false,
								},
							],
						],
					},
				},
			},
		],
	},
};

export default config;
