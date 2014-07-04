/*eslint-env node */
"use strict";

// npm install --save-dev gulp gulp-util chalk gulp-clean gulp-replace-task gulp-cleanhtml gulp-strip-debug gulp-concat gulp-uglify
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var chalk = require('chalk');
var clean = require('gulp-clean');
var replace = require('gulp-replace-task');
var cleanhtml = require('gulp-cleanhtml');
var eslint = require('gulp-eslint');
var stripdebug = require('gulp-strip-debug');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var through2 = require('through2');

var manifest = require('./src/manifest');
var distFilename = manifest.name.replace(/[ ]/g, "_").toLowerCase() + "-v-" + manifest.version + ".zip";
var replaceOpts = {
  patterns: [
  {
    match: /debug\s*:\s*true,/g,
    replacement: "debug: false,"
  },
  {
    match: /.*Logger.*/g,
    replacement: ""
  },
  {
    match: /^.*\/\/ REMOVE START[\s\S]*?\/\/ REMOVE END.*$/gm,
    replacement: ""
  },
  {
    match: /<!-- REMOVE START[\s\S]*?REMOVE END -->/gm,
    replacement: ""
  },
  {
    match: /<!-- BUILD START/g,
    replacement: ""
  },
  {
    match: /BUILD END -->/g,
    replacement: ""
  }
  ]
};

gulp.task('announce', function() {
  gulpUtil.log(
    'Building version', chalk.cyan(manifest.version),
    'of', chalk.cyan(manifest.name),
    'as', chalk.cyan("build/" + distFilename)
  );
});

gulp.task('clean', function() {
  return gulp.src('build', {read: false, force: true})
  .pipe(clean());
});

// ESLINT the javascript BEFORE uglifier ran over them
gulp.task('lint', function () {
  gulp.src(['src/js/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.format());
});

gulp.task('globalJs', function () {
  gulp.src("src/js/global/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('global.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

gulp.task('backgroundJs', function () {
  gulp.src("src/js/background/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('background.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

gulp.task('contentJs', function () {
  gulp.src("src/js/content/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('content.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

gulp.task('optionsJs', function () {
  gulp.src(["src/js/options/*.js", "!src/js/options/logs.js"])
  .pipe(replace(replaceOpts))
  .pipe(concat('options.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

gulp.task('popupJs', function () {
  gulp.src("src/js/popup.js")
  .pipe(replace(replaceOpts))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/popup.js'));
});

// Copies files that can be xopied without changes
gulp.task('copyUnchanged', ['clean'],  function() {
  ["fonts", "images", "css", "vendor", "_locales"].forEach(function (dir) {
    gulp.src('src/' + dir + '/**/*')
    .pipe(gulp.dest('build/' + dir));
  });
});

// Copies HTML files and removes comment and blocks designated
// with <!-- REMOVE START -->
// to <!-- REMOVE END -->
gulp.task('copyHtml', ['copyUnchanged'],  function() {
  gulp.src(['src/html/**/*.html', '!src/html/option/_logs_*.html'])
  .pipe(replace(replaceOpts))
  .pipe(cleanhtml())
  .pipe(gulp.dest('build/html'));
});

gulp.task('mangleHtml', ['copyHtml'], function() {

});

gulp.task('mangleManifest', [ 'clean' ], function() {
  gulp.src('src/manifest.json').pipe(gulp.dest('build'));
});

// running "gulp" will execute this
gulp.task('default', ['announce', 'lint', 'copyHtml', 'globalJs', 'backgroundJs', 'contentJs', 'optionsJs', 'popupJs', 'mangleManifest', 'mangleHtml'], function() {
});
