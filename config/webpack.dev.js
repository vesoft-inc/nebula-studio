const path = require('path');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.base');

const devConfig = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    app: [
      'react-hot-loader/patch',
      path.join(__dirname, '../app/index.tsx'),
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
    open: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    historyApiFallback: true,
    host: 'localhost',
    allowedHosts: 'all',
    hot: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      }
    },
    static: {
      staticOptions: {
        directory: path.resolve(__dirname, '../dist'),
        publicPath: '/',
        // redirect: true,
        serveIndex: true,
      },
    },
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

module.exports = merge.mergeWithCustomize({
  customizeArray(_, b, key) {
    if (key === 'entry.app') {
      return b;
    }
    return undefined;
  },
})(commonConfig, devConfig);
