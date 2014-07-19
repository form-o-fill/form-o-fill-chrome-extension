/*eslint-env node */
"use strict";

// npm install --save-dev gulp gulp-util chalk gulp-replace-task gulp-cleanhtml gulp-strip-debug gulp-concat gulp-uglify gulp-rm gulp-zip gulp-eslint through2 gulp-minify-css gulp-load-plugins

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var chalk = require('chalk');
var replace = require('gulp-replace-task');
var cleanhtml = require('gulp-cleanhtml');
var eslint = require('gulp-eslint');
var stripdebug = require('gulp-strip-debug');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var through2 = require('through2');
var rm = require('gulp-rm');
var zip = require('gulp-zip');
var minifyCSS = require('gulp-minify-css');

// Load the manifest as JSON
var manifest = require('./src/manifest');

// The final .zip filename that gets uploaded to https://chrome.google.com/webstore/developer/dashboard
var distFilename = manifest.name.replace(/[ ]/g, "_").toLowerCase() + "-v-" + manifest.version + ".zip";

//
// Replacements config for gulp-replace
//
// 1. Sets debug: false (in utils.js)
// 2. Removes Logger statements
// 3. Remove everything in .js files between "// REMOVE START" and "REMOVE END"
//    These blocks contain development code that gets optimized away
// 4. Remove everything in .html files between "<!-- REMOVE START" and "REMOVE END -->"
//    These blocks contain development code that gets optimized away
// 5. Activate blocks between "<!-- BUILD START" and "BUILD END -->"
//    These contain the optimized files for the final build
// 6. Remove the "js:" array from the manifest
//    These blocks contain development code that gets optimized away
// 7. Remove the "scripts:" array from the manifest
//    These blocks contain development code that gets optimized away
// 8. Rename the "jsBuild" part in the manifest to be the "js" part
//    These contain the optimized files for the final build
// 9. Rename the "scriptsBuild" part in the manifest to be the "scripts" part
//    These contain the optimized files for the final build
var replaceOpts = {
  preserveOrder: true,
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
    },
    {
      match: /^.*"js":[\s\S]*?\],.*$/gm,
      replacement: ""
    },
    {
      match: /^.*"scripts"[\s\S]*?\],.*$/gm,
      replacement: ""
    },
    {
      match: /"jsBuild"/g,
      replacement: "\"js\""
    },
    {
      match: /"scriptsBuild"/g,
      replacement: "\"scripts\""
    }
  ]
};

// Output which version to build where to
gulp.task('announce', function() {
  gulpUtil.log(
    'Building version', chalk.cyan(manifest.version),
    'of', chalk.cyan(manifest.name),
    'as', chalk.cyan("dist/" + distFilename)
  );
});

// Cleans build and dist dirs
// I sense a bug here!
gulp.task('clean', ["announce"], function() {
  return gulp.src(['build/**'], {read: false})
  .pipe(rm({async: false}));
});

// ESLINT the javascript BEFORE uglifier ran over them
gulp.task('lint', function () {
  return gulp.src(['src/js/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failOnError());
});

// Optimize CSS
gulp.task('css', ['clean'], function () {
  return gulp.src(["src/css/*.css", "!src/css/content.css", "!src/css/popup.css"])
  .pipe(concat('formofill.css'))
  .pipe(minifyCSS())
  .pipe(gulp.dest('build/css/'));
});

// Build global.js
gulp.task('globalJs', ['clean'], function () {
  return gulp.src("src/js/global/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('global.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

// Build background.js
gulp.task('backgroundJs', ['clean'], function () {
  return gulp.src("src/js/background/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('background.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

// Build content.js
gulp.task('contentJs', ['clean'], function () {
  return gulp.src("src/js/content/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('content.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

// Build options.js
gulp.task('optionsJs', ['clean'], function () {
  return gulp.src(["src/js/options/*.js", "!src/js/options/logs.js"])
  .pipe(replace(replaceOpts))
  .pipe(concat('options.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

// Build popup.js
gulp.task('popupJs', ['clean'], function () {
  return gulp.src("src/js/popup.js")
  .pipe(replace(replaceOpts))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js'));
});

// Copies files that can be copied without changes
gulp.task('copyUnchanged', ['clean'],  function() {
  ["fonts", "images", "vendor", "_locales"].forEach(function (dir) {
    gulp.src('src/' + dir + '/**/*')
    .pipe(gulp.dest('build/' + dir));
  });

  return gulp.src(['src/css/content.css', 'src/css/popup.css'])
  .pipe(minifyCSS())
  .pipe(gulp.dest('build/css'));
});

// Copies HTML files and removes comment and blocks (see above)
gulp.task('copyHtml', ['copyUnchanged'],  function() {
  return gulp.src(['src/html/**/*.html', '!src/html/option/_logs_*.html'])
  .pipe(replace(replaceOpts))
  .pipe(cleanhtml())
  .pipe(gulp.dest('build/html'));
});

// Copies and replaces the manifest.json file (see above)
gulp.task('mangleManifest', [ 'clean' ], function() {
  return gulp.src('src/manifest.json')
  .pipe(replace(replaceOpts))
  .pipe(gulp.dest('build'));
});

// running "gulp" will execute this
// Ends with zipping up the build dir
gulp.task('default', ['announce', 'lint', 'copyHtml', 'css', 'globalJs', 'backgroundJs', 'contentJs', 'optionsJs', 'popupJs', 'mangleManifest'], function() {
  gulp.src(['build/**'])
  .pipe(zip(distFilename))
  .pipe(gulp.dest('dist'));
});
