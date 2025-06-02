const path = require("path");
const webpack = require("webpack");
module.exports = {
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      // Não deixe o polyfill entrar no bundle;
      // para Node usaremos o módulo builtin e,
      // no browser, este import não será exigido.
      url: false,
    },
  },
  externals: {
    fs: "commonjs fs",
    url: "commonjs url",
  },
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "mesh-pilot.umd.js",
    library: "MeshPilot",
    libraryTarget: "umd",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|dist)/,
        use: {
          loader: "babel-loader",
          options: { presets: ["@babel/preset-env"] },
        },
      },
    ],
  },
};
