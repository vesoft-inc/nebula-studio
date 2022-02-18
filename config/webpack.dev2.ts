import path from 'path';
import { mergeWithCustomize } from 'webpack-merge';
import commonConfig from './webpack.base';

const devConfig = {
  devtool: 'inline-source-map',
  entry: {
    app: [
      'react-hot-loader/patch',
      path.join(__dirname, '../app-v2/index.tsx'),
    ],
  },

  output: {
    filename: '[name].js',
    publicPath: 'http://127.0.0.1:7002/',
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
    port: 7002,
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

module.exports = mergeWithCustomize({
  customizeArray(_, b, key) {
    if (key === 'entry.app') {
      return b;
    }
    return undefined;
  },
})(commonConfig, devConfig);
