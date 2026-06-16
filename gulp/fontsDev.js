import fs from 'node:fs';
import path from 'node:path';

import gulp from 'gulp';

import { buildFontStyles, prepareFontFiles } from './utils/font-utils.js';

const srcFolder = './src';
const destFolder = './build';

gulp.task('fontsFiles:dev', () =>
	prepareFontFiles({
		srcDir: path.resolve(`${srcFolder}/fonts/`),
		destDir: path.resolve(`${destFolder}/fonts/`),
	})
);

gulp.task('fontsStyle:dev', (done) => {
	const fontsFile = path.resolve(`${srcFolder}/scss/base/_fontsAutoGen.scss`);
	const fontsDir = path.resolve(`${destFolder}/fonts/`);
	const fontFaces = buildFontStyles(fontsDir);

	fs.writeFileSync(fontsFile, fontFaces, 'utf8');
	done();
});

gulp.task('fontsDev', gulp.series('fontsFiles:dev', 'fontsStyle:dev'));
