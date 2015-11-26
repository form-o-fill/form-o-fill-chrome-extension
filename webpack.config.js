/*eslint-env node */
var webpack = require('webpack');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');
var uglify = new webpack.optimize.UglifyJsPlugin();
var dedupe = new webpack.optimize.DedupePlugin();

module.exports = {
  context: __dirname + "/src/js",
  entry: {
    //popup:      "./popup/popup",
    options:    "./options/options",
    background: "./background/background",
    content:    "./content/content"
  },
  output: {
    path: "src/js",
    filename: "[name].js",
    pathinfo: true,
    sourceMapFilename: "[name].map"
  },
  devtool: "#source-map",
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel?presets[]=es2015&cacheDirectory" }
    ]
  },
  resolve: {
    extensions: [".js", ".json"],
    alias: {
      jquery: __dirname + "/src/vendor/jquery/jquery-2.1.4.min.js",
      jsBeautifier: __dirname + "/src/vendor/js-beautifier/beautify.js",
      chanceJs: __dirname + "/src/vendor/chance.js/chance.js",
      momentJs: __dirname + "/src/vendor/moment-with-locales.min.js",
      ace: __dirname + "/src/vendor/ace/ace.js",
      html5sortable: __dirname + "/src/vendor/html5sortable/html.sortable.min.js",
      introJs: __dirname + "/src/vendor/intro.js/intro.min.js"
    }
  },
  plugins: [commonsPlugin, uglify, dedupe]
};
