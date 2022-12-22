const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { setEnv } = require('./env');

setEnv('production');

const config = require('./webpack.base');
config.module.rules.push(
  {
    test: /\.css$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
  },
);
config.plugins.push(
  new CleanWebpackPlugin({
    cleanOnceBeforeBuildPatterns: [path.resolve(__dirname, '..', 'dist')],
  }),
);

config.plugins.push(
  new MiniCssExtractPlugin({
    filename: '[name].[fullhash].css',
    chunkFilename: '[id].[fullhash].css',
  }),
);

module.exports = config;
