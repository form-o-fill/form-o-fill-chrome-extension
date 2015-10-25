/*eslint-env node */
module.exports = {
  context: __dirname + "/src/js",
  entry: {
    //background: "./background/background",
    //popup:      "./popup/popup",
    content:    "./content/content",
    //global:     "./global/global",
    //options:    "./options/options"
  },
  output: {
    path: "src/js",
    filename: "[name].js",
    pathinfo: true
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: "babel-loader" }
    ]
  },
  resolve: {
    extensions: ["", ".js", ".json"],
    alias: {
      jquery: __dirname + "/src/vendor/jquery/jquery-2.1.4.min.js",
      jsBeautifier: __dirname + "/src/vendor/js-beautifier/beautify.js",
      chanceJs: __dirname + "/src/vendor/chance.js/chance.js",
      momentJs: __dirname + "/src/vendor/moment-with-locales.min.js",
      ace: __dirname + "/src/vendor/ace/ace.js",
      html5sortable: __dirname + "/src/vendor/html5sortable/html.sortable.min.js",
      introJs: __dirname + "/src/vendor/intro.js/intro.min.js"
    }
  }
};
