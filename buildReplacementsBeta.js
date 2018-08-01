/*eslint-env node */
//
// Replacements config for gulp-replace BETA

var replaceOpts = {
  preserveOrder: true,
  patterns: [
    {
      // "name": "Form-O-Fill - The programmable form filler",
      match: /"name"\s*:\s*".*",/g,
      replacement: "\"name\": \"Form-o-Fill - BETA\","
    },
    {
      match: /"short_name"\s*:\s*".*",/g,
      replacement: "short_name: \"Form-o-Fill - BETA\","
    }
  ]
};

module.exports = replaceOpts;
