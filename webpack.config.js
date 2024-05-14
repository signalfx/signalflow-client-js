const path = require('path');
const webpack = require('webpack');
const { default: merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');

const baseConfig = {
  mode: "development",
  devtool: "inline-source-map",
  entry: "./lib/index_browser.js",
  output: {
    filename: "signalflow.js",
    path: path.resolve(__dirname, "build"),
    publicPath: "auto",
    library: {
      name: "signalfx.streamer",
      type: "umd"
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^ws$/, (resource) => {
      const pathToWsReplacement = path.resolve(__dirname, 'lib', 'browser', 'ws.js');
      resource.request = path.relative(resource.context, pathToWsReplacement);
    }),
    new CopyPlugin({
      patterns: [
        {
          from: './lib/signalflow.d.ts',
          to: path.resolve(__dirname, 'build', 'signalflow.min.d.ts'),
        },
      ],
    }),
  ],
};

module.exports = (_, argv) => ([
  baseConfig,
  merge(baseConfig, {
    mode: 'production',
    devtool: false,
    output: {
      filename: "signalflow.min.js",
    },
  })
]);
