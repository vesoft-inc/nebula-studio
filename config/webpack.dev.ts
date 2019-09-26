import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import commonConfig from './webpack.base';

const devConfig = {
  devtool: 'inline-source-map',
  entry: {
    app: [
      'react-hot-loader/patch',
      path.join(__dirname, '../app/assets/index.tsx'),
    ],
  },

  output: {
    filename: '[name].js',
    publicPath: 'http://127.0.0.1:8888'
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  devServer: {
    port: 8888,
    contentBase: path.join(__dirname, '../public'),
    historyApiFallback: true,
    host: 'localhost',
    disableHostCheck: true,
  },

  plugins: [
    new webpack.DefinePlugin({
      MOCK: false,
    }),
  ],
};

module.exports = merge({
  customizeArray(_, b, key) {
    if (key === 'entry.app') {
      return b;
    }
    return undefined;
  },
})(commonConfig, devConfig);
