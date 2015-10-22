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
      jquery: __dirname + "/src/vendor/jquery/jquery-2.1.4.min.js"
    }
  }
};
