/*eslint-env node */
var chalk = require('chalk');
var gulp = require('gulp');
var argv = require('yargs').argv;
var plugins = require('gulp-load-plugins')();

// this can be used to debug gulp runs:
// .pipe(debug({verbose: true}))

// Load the manifest as JSON
var manifest = require('./src/manifest');

// The final .zip filename that gets uploaded to https://chrome.google.com/webstore/developer/dashboard
var distFilename = manifest.name.replace(/[ ]/g, "_").toLowerCase() + "-v-" + manifest.version + ".zip";

// Load Utils for ##Utils.*## replacements
var Utils = require('./src/js/global/utils');

// Load replacement variables
var replaceOpts = require("./buildReplacements");
var replaceOptsBeta = require("./buildReplacementsBeta");

// Replace all occurences of ##Utils.someKey## by it's value
Object.keys(Utils).forEach(function(key) {
  var val = Utils[key];
  if (typeof val === "string" || typeof val === "number") {
    replaceOpts.patterns.push({
      match: new RegExp("##Utils\." + key + "##"),
      replacement: val
    });
  }
});

//
// Helper to run all tests thru mocha
//
var runTests = function() {
  return gulp.src(['test/**/*_spec.js'], {read: false}).pipe(plugins.spawnMocha({
    R: 'dot',
    c: true,
    debug: true
  })).on('error', console.warn.bind(console));
};

//
// Output which version to build and to where
//
gulp.task('announce', function() {
  plugins.util.log(
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
  .pipe(plugins.rm({async: false}));
});

//
// ESLINT the javascript (BEFORE uglifier ran over it)
//
gulp.task('lint', function () {
  return gulp.src(['src/js/*/*.js', '!src/js/background.js', '!src/js/fof_content.js', '!src/js/popup.js', '!src/js/options.js'])
  .pipe(plugins.eslint())
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failOnError());
});

//
// Optimize CSS
//
gulp.task('optimizeCss', ['clean'], function () {
  // Optimize main options.css
  gulp.src(["src/vendor/intro.js/introjs.min.css", "src/css/*.css", "!src/css/content.css", "!src/css/popup.css"], { nonegate: false })
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.concat('options.css'))
  .pipe(plugins.cssnano())
  .pipe(gulp.dest('build/css/'));

  // optimize content and popup css
  return gulp.src(['src/css/content.css', 'src/css/popup.css'])
  .pipe(plugins.cssnano())
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(gulp.dest('build/css'));
});

//
// Build global.js
// Sadly until I use webpack here the order is important :(
//
gulp.task('globalJs', ['clean'], function () {
  return gulp.src([
    "src/js/global/utils.js",
    "src/js/global/state.js",
    "src/js/global/jsonf.js",
    "src/js/global/storage.js",
    "src/js/global/rule.js",
    "src/js/global/rules.js",
    "src/js/global/i18n.js",
    "src/js/global/libs.js",
    "src/js/global/workflows.js",
    "src/js/global/crypto.js"
  ])
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.concat('global.js'))
  .pipe(plugins.stripDebug())
  .pipe(plugins.uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build background.js
// Order dependent :( -> will use webpack some day
//
gulp.task('backgroundJs', ['clean'], function () {
  return gulp.src([
    "src/js/background/alarm.js",
    "src/js/background/changelog.js",
    "src/js/background/context_menu.js",
    "src/js/background/remote_import.js",
    "src/js/background/badge.js",
    "src/js/background/form_util.js",
    "src/js/background/notification.js",
    "src/js/background/on_install.js",
    "src/js/background/screenshooter.js",
    "src/js/background/background.js",
    "src/js/background/testing.js",
    "src/js/background/tutorial.js"
  ])
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.concat('background.js'))
  .pipe(plugins.stripDebug())
  .pipe(plugins.uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build fof_content.js
//
gulp.task('contentJs', ['clean'], function () {
  return gulp.src([
    "src/vendor/optimal-select/optimal-select.js",
    "src/js/content/*.js"
  ])
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.concat('fof_content.js'))
  .pipe(plugins.stripDebug())
  .pipe(plugins.uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build options.js
// Order dependent :( -> will use webpack some day
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
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.concat('options.js'))
  .pipe(plugins.stripDebug())
  .pipe(plugins.uglify())
  .pipe(gulp.dest('build/js/'));
});

//
// Build popup.js
//
gulp.task('popupJs', ['clean'], function () {
  return gulp.src("src/js/popup/popup.js")
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.stripDebug())
  .pipe(plugins.uglify())
  .pipe(gulp.dest('build/js'));
});

//
// Copies files that can be copied without changes
//
gulp.task('copyUnchanged', ['clean'], function() {
  ["fonts", "images", "vendor", "_locales"].forEach(function (dir) {
    gulp.src(['src/' + dir + '/**/*' ], { nonegate: false })
    .pipe(gulp.dest('build/' + dir));
  });
});

//
// Copies HTML files and removes comment and blocks (see above)
//
gulp.task('copyHtml', ['copyUnchanged'], function() {
  return gulp.src(['src/html/**/*.html', '!src/html/options/_logs_*.html'], { nonegate: false })
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(plugins.cleanhtml())
  .pipe(gulp.dest('build/html'));
});

//
// Copies and replaces the manifest.json file (see above)
//
gulp.task('mangleManifest', [ 'clean' ], function() {
  return gulp.src('src/manifest.json')
  .pipe(plugins.replaceTask(replaceOpts))
  .pipe(gulp.dest('build'));
});

//
// SASS -> CSS
// Output is expanded since it will be compressed if
// running 'build'
gulp.task('sass', function () {
  gulp.src('src/sass/*.scss')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({outputStyle: "expanded"}).on('error', plugins.sass.logError))
    .pipe(plugins.sourcemaps.write('.'))
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
  .pipe(plugins.zip(distFilename))
  .pipe(gulp.dest('dist'));
});

//
// Build a BETA
//
gulp.task('build-beta', ['build'], function() {
  gulp.src('src/manifest.json')
  .pipe(plugins.replaceTask(replaceOptsBeta))
  .pipe(gulp.dest('build'));

  gulp.src(['build/**'])
  .pipe(plugins.zip(distFilename + ".beta.zip"))
  .pipe(gulp.dest('dist'));
});
//
// Run tests
//
gulp.task('test', function () {
  plugins.util.log('Running tests');
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
  plugins.connect.server({
    root: "testcases/docroot-for-testing",
    livereload: false,
    port: 9292
  });
});

//
// Kills the server (for integration tests)
//
gulp.task('webserver:stop', plugins.connect.serverClose);

gulp.task("integration", [ "webserver:start", "integration:run" ], function() {
  plugins.connect.serverClose();
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
  .pipe(plugins.webdriver({desiredCapabilities: {
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
