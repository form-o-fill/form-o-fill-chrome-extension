/*eslint-env node */
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
// 13. Replace the dev alarm of one minute with the production version of 15 minutes
//

// Load the manifest as JSON
var manifest = require('./src/manifest');

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

module.exports = replaceOpts;
