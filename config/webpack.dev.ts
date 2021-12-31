import path from 'path';
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
    publicPath: 'http://127.0.0.1:7001/',
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
    port: 7001,
    headers: { 'Access-Control-Allow-Origin': '*' },
    contentBase: path.join(__dirname, '../public'),
    historyApiFallback: true,
    host: 'localhost',
    disableHostCheck: true,
    proxy: [
      {
        path: '/api-nebula/**',
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
      {
        path: '/api/**',
        target: 'http://127.0.0.1:9000',
        changeOrigin: true,
      },
    ]
  },
};

module.exports = merge({
  customizeArray(_, b, key) {
    if (key === 'entry.app') {
      return b;
    }
    return undefined;
  },
})(commonConfig, devConfig);
