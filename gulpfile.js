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

var manifest = require('./src/manifest');
var distFilename = manifest.name.replace(/[ ]/g, "_").toLowerCase() + "-v-" + manifest.version + ".zip";

// Detect scripts common between two passed in arrays of file names
var commonBetween = function(one, two) {
  var common = [];

  // Detect common javascripts between content and background scripts
  one.forEach(function (bg) {
    if (two.indexOf(bg) !== -1) {
      common.push(bg);
    }
  });

  common = common.map(function(jsFileName) {
    return "src/" + jsFileName;
  });

  return common;
};

gulp.task('announce', function() {
  gulpUtil.log(
    'Building version', chalk.cyan(manifest.version),
    'of', chalk.cyan(manifest.name),
    'as', chalk.cyan("build/" + distFilename)
  );
});

gulp.task('clean', function() {
 return gulp.src('build', {read: false})
    .pipe(clean());
});

// ESLINT the javascript BEFORE uglifier ran over them
gulp.task('lint', function () {
  gulp.src(['src/js/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.format());
});


gulp.task('commonJs', function () {
  var bgJs = manifest.background.scripts;
  var contentJs = manifest.content_scripts[0].js;

  var common = commonBetween(bgJs, contentJs).filter(function (jsFileName) {
    return (jsFileName.indexOf("logger.js") === -1);
  });

  gulpUtil.log("Found", chalk.cyan(common.length), "common JS files (" + common.join(", ") + ")");

  gulp.src(common)
  .pipe(replace({
    patterns: [
      {
        match: /debug\s*:\s*true,/g,
        replacement: "debug: false,"
      },
      {
        match: /.*Logger.*/g,
        replacement: ""
      }
    ]
  }))
  .pipe(concat('common.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

// Copies files that can be xopied without changes
gulp.task('copyUnchanged', ['clean'],  function() {
  ["fonts", "images", "css", "vendor", "_locales"].forEach(function (dir) {
    gulp.src('src/' + dir + '/**/*')
    .pipe(gulp.dest('build/' + dir));
  });
  gulp.src('src/manifest.json').pipe(gulp.dest('build'));
});

// Copies HTML files and removes comment and blocks designated
// with <!-- REMOVE START -->
// to <!-- REMOVE END -->
gulp.task('copyHtml', ['copyUnchanged'],  function() {
    gulp.src('src/html/**/*.html')
    .pipe(cleanhtml())
    .pipe(replace({
      patterns: [{
        match: /<!-- REMOVE START[\s\S]*?REMOVE END -->/gm,
        replacement: ""
      }]
    }))
    .pipe(gulp.dest('build/html'));
});

// running "gulp" will execute this
gulp.task('default', ['announce', 'lint', 'copyHtml', 'commonJs'], function() {
});
