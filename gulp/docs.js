import fs from 'node:fs';
import { finished } from 'node:stream/promises';

import autoprefixer from 'gulp-autoprefixer';
import browserSyncFactory from 'browser-sync';
import csso from 'gulp-csso';
import gulp from 'gulp';
import changed from 'gulp-changed';
import fileInclude from 'gulp-file-include';
import htmlclean from 'gulp-htmlclean';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import replace from 'gulp-replace';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import typograf from 'gulp-typograf';
import webpHTML from 'gulp-webp-retina-html';
import webpackStream from 'webpack-stream';

import webpackConfig from '../webpack.config.js';
import { fixHtmlPaths } from './utils/html-path-fix.js';
import { buildSvgSprite } from './utils/svg-sprite-utils.js';
import { canGenerateWebp, generateWebpImages } from './utils/webp-utils.js';

const sass = gulpSass(dartSass);
const browserSync = browserSyncFactory.create();

const fileIncludeSetting = {
	prefix: '@@',
	basepath: '@file',
};

const plumberNotify = (title) => ({
	errorHandler: notify.onError({
		title,
		message: 'Error <%= error.message %>',
		sound: false,
	}),
});

const cleanDirectory = async (directoryPath) => {
	await fs.promises.rm(directoryPath, { recursive: true, force: true });
};

gulp.task('clean:docs', () => cleanDirectory('./docs/'));

gulp.task('html:docs', function () {
	let stream = gulp
		.src(['./src/html/**/*.html', '!./**/blocks/**/*.*', '!./src/html/docs/**/*.*'])
		.pipe(plumber(plumberNotify('HTML')))
		.pipe(fileInclude(fileIncludeSetting))
		.pipe(
			replace(/<img(?:.|\n|\r)*?>/g, (match) =>
				match.replace(/\r?\n|\r/g, '').replace(/\s{2,}/g, ' ')
			)
		)
		.pipe(fixHtmlPaths())
		.pipe(
			typograf({
				locale: ['ru', 'en-US'],
				htmlEntity: { type: 'digit' },
				safeTags: [
					['<\\?php', '\\?>'],
					['<no-typography>', '</no-typography>'],
				],
			})
		);

	if (canGenerateWebp()) {
		stream = stream.pipe(
			webpHTML({
				extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
				retina: {
					1: '',
					2: '@2x',
				},
			})
		);
	}

	return stream.pipe(htmlclean()).pipe(gulp.dest('./docs/'));
});

gulp.task('sass:docs', function () {
	return gulp
		.src('./src/scss/*.scss')
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(
			replace(
				/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^/'"]+(\/))?([^'"]*)\1/gi,
				'$1$2$3$4$6$1'
			)
		)
		.pipe(csso())
		.pipe(gulp.dest('./docs/css/'));
});

gulp.task('images:docs', async function () {
	if (canGenerateWebp()) {
		await generateWebpImages({
			srcRoot: './src/img',
			destRoot: './docs/img',
			exclude: ['./src/img/svgicons'],
			quality: 85,
		});
	}

	const stream = gulp
		.src(['./src/img/**/*', '!./src/img/svgicons/**/*'])
		.pipe(changed('./docs/img/'))
		.pipe(gulp.dest('./docs/img/'));

	await finished(stream);
});

gulp.task('svgSprite:docs', () =>
	buildSvgSprite({
		src: './src/img/svgicons/**/*.svg',
		destFile: './docs/img/svgsprite/sprite.symbol.svg',
	})
);

gulp.task('svgStack:docs', gulp.series('svgSprite:docs'));
gulp.task('svgSymbol:docs', gulp.series('svgSprite:docs'));

gulp.task('files:docs', function () {
	return gulp
		.src('./src/files/**/*', { allowEmpty: true })
		.pipe(changed('./docs/files/'))
		.pipe(gulp.dest('./docs/files/'));
});

gulp.task('js:docs', function () {
	return gulp
		.src('./src/js/*.js')
		.pipe(plumber(plumberNotify('JS')))
		.pipe(webpackStream({ ...webpackConfig, mode: 'production' }))
		.pipe(gulp.dest('./docs/js/'));
});

gulp.task('server:docs', function (done) {
	browserSync.init({
		server: {
			baseDir: './docs/',
		},
		port: 3001,
		notify: false,
		open: 'local',
		ghostMode: false,
		files: ['./docs/**/*.*'],
	});

	done();
});
