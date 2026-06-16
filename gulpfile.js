import gulp from 'gulp';

import './gulp/dev.js';
import './gulp/docs.js';
import './gulp/fontsDev.js';
import './gulp/fontsDocs.js';

const buildDev = gulp.series(
	'clean:dev',
	'fontsDev',
	gulp.parallel('html:dev', 'sass:dev', 'images:dev', 'svgSprite:dev', 'files:dev', 'js:dev')
);

const buildDocs = gulp.series(
	'clean:docs',
	'fontsDocs',
	gulp.parallel(
		'html:docs',
		'sass:docs',
		'images:docs',
		'svgSprite:docs',
		'files:docs',
		'js:docs'
	)
);

gulp.task('build:dev', buildDev);
gulp.task('build:docs', buildDocs);
gulp.task('build', buildDocs);
gulp.task('docs', buildDocs);
gulp.task('clean', gulp.parallel('clean:dev', 'clean:docs'));
gulp.task('fonts', gulp.series('fontsDev', 'fontsDocs'));

gulp.task('dev', gulp.series(buildDev, gulp.parallel('server:dev', 'watch:dev')));
gulp.task('preview', gulp.series(buildDocs, 'server:docs'));
gulp.task('default', gulp.series('dev'));
