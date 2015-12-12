/*eslint-env node */

var chalk = require('chalk');
var cleanhtml = require('gulp-cleanhtml');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var minifyCSS = require('gulp-minify-css');
var mocha = require('gulp-spawn-mocha');
var replace = require('gulp-replace-task');
var rm = require('gulp-rm');
var stripdebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var argv = require('yargs').argv;
var webdriver = require('gulp-webdriver');
var connect = require('gulp-connect');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

// this can be used to debug gulp runs
// .pipe(debug({verbose: true}))
/*eslint-disable no-unused-vars */
var debug = require('gulp-debug');
/*eslint-enable no-unused-vars */

// Load the manifest as JSON
var manifest = require('./src/manifest');

// The final .zip filename that gets uploaded to https://chrome.google.com/webstore/developer/dashboard
var distFilename = manifest.name.replace(/[ ]/g, "_").toLowerCase() + "-v-" + manifest.version + ".zip";

// Load Utils for ##Utils.*## replacements
var Utils = require('./src/js/global/utils');

//
// Replacements config for gulp-replace
//
// 1.  Sets debug: false (in utils.js)
// 2.  Removes Logger statements
// 3.  Remove everything in .js files between "// REMOVE START" and "REMOVE END"
//     These blocks contain development code that gets optimized away
// 4.  Remove everything in .html files between "<!-- REMOVE START" and "REMOVE END -->"
//     These blocks contain development code that gets optimized away
// 5.  Activate blocks between "<!-- BUILD START" and "BUILD END -->"
//     These contain the optimized files for the final build
// 6.  Remove the "js:" array from the manifest
//     These blocks contain development code that gets optimized away
// 7.  Remove the "scripts:" array from the manifest
//     These blocks contain development code that gets optimized away
// 8.  Rename the "jsBuild" part in the manifest to be the "js" part
//     These contain the optimized files for the final build
// 9.  Rename the "scriptsBuild" part in the manifest to be the "scripts" part
//     These contain the optimized files for the final build
// 10. Replace ##VERSION## with the correct version string from the manifest
// 11. Replaces the local reference URL to the tutorial site with the live one
// 12. In dev mode the extension should persist and should not be unloaded
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
    },
    {
      match: /##VERSION##/g,
      replacement: manifest.version
    },
    {
      match: /href="http:\/\/localhost:4000\//g,
      replacement: "href=\"http://form-o-fill.github.io/"
    },
    {
      match: /"persistent": true/,
      replacement: "\"persistent\": false"
    },
    {
      match: /alarmIntervalInMinutes\s*:\s*1/,
      replacement: "alarmIntervalInMinutes: 15"
    }
  ]
};

Object.keys(Utils).forEach(function(key) {
  var val = Utils[key];
  if(typeof val === "string" || typeof val === "number") {
    replaceOpts.patterns.push({
      match: new RegExp("##Utils\." + key + "##"),
      replacement: val
    });
  }
});

// Helper to run all tests thru mocha
var runTests = function() {
  return gulp.src(['test/**/*_spec.js'], {read: false}).pipe(mocha({
    R: 'dot',
    c: true,
    debug: true
  })).on('error', console.warn.bind(console));
};

//
// Output which version to build where to
//
gulp.task('announce', function() {
  gulpUtil.log(
    'Building version', chalk.cyan(manifest.version),
    'of', chalk.cyan(manifest.name),
    'as', chalk.cyan("dist/" + distFilename)
  );
});

//
// Cleans build and dist dirs
//
gulp.task('clean', ["announce"], function() {
  return gulp.src(['build/**', 'build/*'], {read: false})
  .pipe(rm({async: false}));
});

//
// ESLINT the javascript (BEFORE uglifier ran over them)
//
gulp.task('lint', function () {
  return gulp.src(['src/js/*/*.js', '!src/js/background.js', '!src/js/content.js'])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failOnError());
});

//
// Optimize CSS
//
gulp.task('optimizeCss', ['clean'], function () {

  // Optimize main options.css
  gulp.src(["src/vendor/intro.js/introjs.min.css", "src/css/*.css", "!src/css/content.css", "!src/css/popup.css"], { nonegate: false })
  .pipe(replace(replaceOpts))
  .pipe(concat('options.css'))
  .pipe(minifyCSS())
  .pipe(gulp.dest('build/css/'));

  // optimize content and popup css
  return gulp.src(['src/css/content.css', 'src/css/popup.css'])
  .pipe(minifyCSS())
  .pipe(replace(replaceOpts))
  .pipe(gulp.dest('build/css'));
});

//
// Build global.js
// Sadly until I use require.js here the order is important :(
//
gulp.task('globalJs', ['clean'], function () {
  return gulp.src([
    "src/js/global/utils.js",
    "src/js/global/jsonf.js",
    "src/js/global/storage.js",
    "src/js/global/rule.js",
    "src/js/global/rules.js",
    "src/js/global/i18n.js",
    "src/js/global/libs.js",
    "src/js/global/workflows.js"
  ])
  .pipe(replace(replaceOpts))
  .pipe(concat('global.js'))
  .pipe(stripdebug())
  //.pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build background.js
//
gulp.task('backgroundJs', ['clean'], function () {
  return gulp.src([
    "src/js/background/alarm.js",
    "src/js/background/changelog.js",
    "src/js/background/context_menu.js",
    "src/js/background/remote_import.js",
    "src/js/background/form_util.js",
    "src/js/background/notification.js",
    "src/js/background/background.js",
    "src/js/background/testing.js",
    "src/js/background/tutorial.js"
  ])
  .pipe(replace(replaceOpts))
  .pipe(concat('background.js'))
  .pipe(stripdebug())
  //.pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build content.js
//
gulp.task('contentJs', ['clean'], function () {
  return gulp.src("src/js/content/*.js")
  .pipe(replace(replaceOpts))
  .pipe(concat('content.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build options.js
//
gulp.task('optionsJs', ['clean'], function () {
  return gulp.src([
    "src/js/options/editor.js",
    "src/js/options/chrome_bootstrap.js",
    "src/js/options/tabs.js",
    "src/js/options/import_export.js",
    "src/js/options/tutorial.js",
    "src/js/options/options.js",
    "src/js/options/help.js",
    "src/js/options/workflow.js",
    "src/js/options/settings.js",
    "src/js/options/rule_summary.js"
  ])
  .pipe(replace(replaceOpts))
  .pipe(concat('options.js'))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build popup.js
//
gulp.task('popupJs', ['clean'], function () {
  return gulp.src("src/js/popup/popup.js")
  .pipe(replace(replaceOpts))
  .pipe(stripdebug())
  .pipe(uglify())
  .pipe(gulp.dest('build/js'));
});

//
// Copies files that can be copied without changes
//
gulp.task('copyUnchanged', ['clean'], function() {
  ["fonts", "images", "vendor", "_locales"].forEach(function (dir) {
    gulp.src(['src/' + dir + '/**/*', "!src/vendor/jquery/jquery-2.1.4.js"], { nonegate: false })
    .pipe(gulp.dest('build/' + dir));
  });
});

//
// Copies HTML files and removes comment and blocks (see above)
//
gulp.task('copyHtml', ['copyUnchanged'], function() {
  return gulp.src(['src/html/**/*.html', '!src/html/options/_logs_*.html'], { nonegate: false })
  .pipe(replace(replaceOpts))
  .pipe(cleanhtml())
  .pipe(gulp.dest('build/html'));
});

//
// Copies and replaces the manifest.json file (see above)
//
gulp.task('mangleManifest', [ 'clean' ], function() {
  return gulp.src('src/manifest.json')
  .pipe(replace(replaceOpts))
  .pipe(gulp.dest('build'));
});

//
// SASS -> CSS
// Output is expanded since it will be compressed if
// running 'build'
gulp.task('sass', function () {
  gulp.src('src/sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: "expanded"}).on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('src/css'));
});

//
// Watch and live compile SASS -> CSS
//
gulp.task('sass:watch', function () {
  gulp.watch('src/sass/**/*.scss', ['sass']);
});

//
// Build a distribution
//
gulp.task('build', ['announce', 'clean', 'test', 'lint', 'copyHtml', 'sass', 'optimizeCss', 'globalJs', 'backgroundJs', 'contentJs', 'optionsJs', 'popupJs', 'mangleManifest'], function() {
  gulp.src(['build/**'])
  .pipe(zip(distFilename))
  .pipe(gulp.dest('dist'));
});

//
// Run tests
//
gulp.task('test', function () {
  gulpUtil.log('Running tests');
  return runTests().on('error', function (e) {
    throw e;
  });
});

//
// Run tests through watching
//
gulp.task('test:watch', function () {
  gulp.watch(['src/js/**/*.js', 'test/**/*.js'], runTests);
});

//
// Starts a simple webserver hosting the integration test files
//
gulp.task('webserver:start', function() {
  connect.server({
    root: "testcases/docroot-for-testing",
    livereload: false,
    port: 9292
  });
});

//
// Kills the server (for integration tests)
//
gulp.task('webserver:stop', connect.serverClose);

gulp.task("integration", [ "webserver:start", "integration:run" ], function() {
  connect.serverClose();
});

// Integration testing (end-to-end)
// Uses webdriverio as an abstraction layer over chromedriver
//
// You can specify a single spec to run via:
// gulp integration --spec test/integration/some_spec_scene.js
//
// Specify a single spec with
// gulp integration --grep "a\sregex"
gulp.task('integration:run', [ "webserver:start" ], function () {

  var specs = [
    "./test/integration/test_setup_scene.js",
    "./test/integration/all_types_scene.js",
    "./test/integration/form_filling_scene.js",
    "./test/integration/shared_rules_scene.js",
    "./test/integration/popup_scene.js",
    "./test/integration/form_extraction_scene.js",
    "./test/integration/options_scene.js"
  ];

  // Allow --spec parameter
  if (argv.spec) {
    specs = [argv.spec];
  }

  var mochaOpts = {
    R: 'spec',
    c: true,
    debug: false,
    inlineDiffs: true
  };

  // Allow --grep as mocha opt
  if (argv.grep) {
    mochaOpts.grep = argv.grep;
  }

  return gulp.src(specs, {read: false})
  .pipe(webdriver({desiredCapabilities: {
    browserName: "chrome"
  }}));
});

// Watch for changes
gulp.task("watch", function() {
  gulp.watch(['test/**/*.js'], runTests);
  gulp.watch('src/sass/**/*.scss', ['sass']);
});

//
// DEFAULT
// running "gulp" will execute this
//
gulp.task('default', function () {
  runTests();
});
