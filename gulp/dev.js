import fs from 'node:fs';
import { finished } from 'node:stream/promises';

import browserSyncFactory from 'browser-sync';
import gulp from 'gulp';
import changed from 'gulp-changed';
import fileInclude from 'gulp-file-include';
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

gulp.task('clean:dev', () => cleanDirectory('./build/'));

gulp.task('html:dev', function () {
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

	return stream.pipe(gulp.dest('./build/'));
});

gulp.task('sass:dev', function () {
	return gulp
		.src('./src/scss/*.scss')
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sass.sync().on('error', sass.logError))
		.pipe(
			replace(
				/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^/'"]+(\/))?([^'"]*)\1/gi,
				'$1$2$3$4$6$1'
			)
		)
		.pipe(gulp.dest('./build/css/'))
		.pipe(browserSync.stream());
});

gulp.task('images:dev', async function () {
	if (canGenerateWebp()) {
		await generateWebpImages({
			srcRoot: './src/img',
			destRoot: './build/img',
			exclude: ['./src/img/svgicons'],
			quality: 85,
		});
	}

	const stream = gulp
		.src(['./src/img/**/*', '!./src/img/svgicons/**/*'])
		// ФИКС: Убрали плагин changed, чтобы картинки полностью перезаписывались без багов кэша
		.pipe(gulp.dest('./build/img/'));

	await finished(stream);
});

gulp.task('svgSprite:dev', () =>
	buildSvgSprite({
		src: './src/img/svgicons/**/*.svg',
		destFile: './build/img/svgsprite/sprite.symbol.svg',
	})
);

gulp.task('svgStack:dev', gulp.series('svgSprite:dev'));
gulp.task('svgSymbol:dev', gulp.series('svgSprite:dev'));

gulp.task('files:dev', function () {
	return gulp
		.src('./src/files/**/*', { allowEmpty: true })
		.pipe(changed('./build/files/'))
		.pipe(gulp.dest('./build/files/'));
});

gulp.task('js:dev', function () {
	return gulp
		.src('./src/js/*.js')
		.pipe(plumber(plumberNotify('JS')))
		.pipe(webpackStream({ ...webpackConfig, mode: 'development', devtool: 'source-map' }))
		.pipe(gulp.dest('./build/js/'));
});

gulp.task('server:dev', function (done) {
	browserSync.init({
		server: {
			baseDir: './build/',
		},
		port: 3000,
		notify: false,
		open: 'local',
		ghostMode: false,
		files: ['./build/**/*.*'],
	});

	done();
});

gulp.task('watch:dev', function () {
	gulp.watch('./src/scss/**/*.scss', gulp.parallel('sass:dev'));
	gulp.watch(['./src/html/**/*.html', './src/html/**/*.json'], gulp.parallel('html:dev'));
	gulp.watch('./src/img/**/*', gulp.parallel('images:dev'));
	gulp.watch('./src/files/**/*', gulp.parallel('files:dev'));
	gulp.watch('./src/js/**/*.js', gulp.parallel('js:dev'));
	gulp.watch('./src/img/svgicons/**/*.svg', gulp.series('svgSprite:dev'));
});
