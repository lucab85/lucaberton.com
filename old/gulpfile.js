'use strict';

var gulp		= require('gulp'),
    htmlmin		= require('gulp-htmlmin'),
    del			= require("del");
var exec		= require('child_process').exec;
var workboxBuild = require('workbox-build');
var babel		 = require('gulp-babel');
var uglify		 = require('gulp-uglify');
var runSequence	= require('run-sequence');
var replace = require('gulp-replace');

var DEST = 'dist/';
var HTMLMIN_opts = {
	collapseWhitespace: true, 
	removeComments: true, 
	minifyCSS: true, 
	minifyJS: true	
};
var REPLACE_SRC1 = '//lucaberton.it';
var REPLACE_DST1 = 'https://lucaberton.it';
var REPLACE_SRC2 = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
var REPLACE_DST2 = '<urlset \
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd \
    http://www.w3.org/1999/xhtml http://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd" \
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" \
    xmlns:xhtml="http://www.w3.org/1999/xhtml" \
>';

gulp.task('clean', function() {
  var opts = {dryRun: false, dot: true};
  var deletedFiles = del.sync(DEST + "**/*", opts);
});

gulp.task('html', function() {
  return gulp.src('public/**/*.html')
    .pipe(htmlmin(HTMLMIN_opts))
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('css', function() {
  return gulp.src('public/**/*.css')
    .pipe(htmlmin(HTMLMIN_opts))
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('js-min', function() {
  return gulp.src('public/**/*.min.js')
	.pipe(uglify())
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('xml', function() {
  return gulp.src('public/**/*.xml')
	.pipe(replace(REPLACE_SRC1, REPLACE_DST1))
	.pipe(replace(REPLACE_SRC2, REPLACE_DST2))
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('json', function() {
  return gulp.src('public/**/*.json')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('jpg', function() {
  return gulp.src('public/**/*.jpg')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('png', function() {
  return gulp.src('public/**/*.png')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('ico', function() {
  return gulp.src('public/**/*.ico')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('pdf', function() {
  return gulp.src('public/**/*.pdf')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('sw-bundle', function() {
   return workboxBuild.generateSW({
     globDirectory: './dist/',
     swDest: 'public/sw.js',
     globPatterns: ['**\/*.{js,css,html,jpg,ico,png}'],
     globIgnores: ['admin.html'],
     maximumFileSizeToCacheInBytes: 2097152,
     runtimeCaching: [{
		 urlPattern: /.(jpg|ico|png)$/,
		 handler: 'networkFirst',
		 options: {
			cacheName: 'image-cache',
			cacheExpiration: {
			  maxEntries: 10,
			},
		}
	}],
   })
   .then(() => {
     console.log('Service worker generated.');
   })
   .catch((err) => {
     console.log('[ERROR] This happened: ' + err);
   });
});

gulp.task('sw-js-copy', function() {
  return gulp.src('public/*sw*.js')
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

gulp.task('sw-js', function() {
  return gulp.src('public/*sw*.js')
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify())
    .on('error', console.error)
    .pipe(gulp.dest(DEST));
});

// Run Hugo to copy finished files over to public folder
gulp.task('hugo', function (fetch) {
    return exec('hugo -v --i18n-warnings', function (err, stdout, stderr) {
        // console.log(stdout); // See Hugo output
        // console.log(stderr); // Debugging feedback
        fetch(err);
    });
})


gulp.task("build", ['hugo'])
gulp.task("postprocess", ['clean', 'html', 'css', 'js-min', 'xml', 'json', 'jpg', 'png', 'ico', 'pdf'])
gulp.task("serviceworker", function(callback) {
  runSequence('sw-bundle', 'sw-js-copy', callback);
});

gulp.task('default', function(callback) {
  runSequence('build', 'postprocess', 'serviceworker', callback);
});
