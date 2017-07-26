const path = require("path");
const HtmlWebpackPluginOptions = require('html-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, "source/js"),
  entry: {
    //background: "background/background.js",
    //popup:      "popup/popup.js",
    //content:    "content/content.js",
    //global:     "./source/js/global/global.js"
    options:    "./options/options.js"
  },

  devtool: "cheap-eval-source-map",

  output: {
    path: path.resolve(__dirname, "build-ext/js"),
    filename: "[name].bundle.js"
  },

  module: {
    rules: [
      { test: /\.js$/, loader: "babel-loader" }
    ]
  },

  plugins: [
    new HtmlWebpackPluginOptions({
    })
  ]
};
