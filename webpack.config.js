/*eslint-env node */
var webpack = require('webpack');

var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

//var uglify = new webpack.optimize.UglifyJsPlugin();
//var dedupe = new webpack.optimize.DedupePlugin();

module.exports = {
  context: __dirname + "/src/js",
  entry: {
    //popup:      "./popup/popup",
    //options:    "./options/options",
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
      {
        test: /\.js$/,
        include: /src\/js\/.*\/.*.js$/,
        loader: "babel",
        query: {
          presets: ["es2015"],
          cacheDirectory: true,
          ignore: [
            "vendor"
          ]
        }
      }
    ]
  },
  resolve: {
    extensions: ["", ".js", ".json"],
    alias: {
      jQuery: __dirname + "/src/vendor/jquery/jquery-2.1.4.js",
      jsBeautifier: __dirname + "/src/vendor/js-beautifier/beautify.js",
      chanceJs: __dirname + "/src/vendor/chance.js/chance.js",
      momentJs: __dirname + "/src/vendor/moment-with-locales.js",
      ace: __dirname + "/src/vendor/ace/ace.js",
      html5sortable: __dirname + "/src/vendor/html5sortable/html.sortable.js",
      introJs: __dirname + "/src/vendor/intro.js/intro.js"
    }
  },
  plugins: [commonsPlugin]
};
