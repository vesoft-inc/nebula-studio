const path = require('path');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.base');
const { setEnv } = require('./env');

setEnv('development');

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
    host: '127.0.0.1',
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
        // directory: path.resolve(__dirname, '../public'),
        publicPath: '/',
        // redirect: true,
        serveIndex: true,
      },
    },
    proxy: [
      {
        path: '/api-nebula/**',
        target: 'http://192.168.8.131:7002',
        changeOrigin: true,
      },
      {
        path: '/api/**',
        target: 'http://192.168.8.131:7002',
        changeOrigin: true,
      },
      {
        path: '/nebula_ws',
        target: 'ws://192.168.8.131:7002',
        changeOrigin: true,
        secure: false,
        ws: true,
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
