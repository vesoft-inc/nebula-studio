const path = require('path');
const webpack = require('webpack');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Package = require('../package.json');
const { getAppConfig } = require('./config');
const { getEnv } = require('./env');

const appConfig = getAppConfig();

const isDevEnv = () => getEnv() === 'development';

const commonConfig = {
  entry: {
    app: [path.join(__dirname, '../app/index.tsx')],
  },
  module: {
    exprContextCritical: true,
    rules: [
      {
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /(?<!module)\.less$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: {
                  'primary-color': '#2F80ED',
                  'menu-dark-bg': '#2F3A4A',
                  'table-header-bg': '#E9EDEF',
                  'table-header-color': '#465B7A',
                  'table-header-cell-split-color': '#E9EDEF',
                  'layout-body-background': '#F8F8F8',
                  'font-family': 'Robot-Regular, sans-serif',
                  'height-base': '38px',
                },
              },
            },
          },
        ],
      },
      {
        test: /\.module\.less$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                mode: 'local',
                exportGlobals: true,
                localIdentName: '[local]__[hash:base64:5]',
                localIdentContext: path.resolve(__dirname, '..', 'src'),
              },
            },
          },
          'postcss-loader',
          { loader: 'less-loader', options: { lessOptions: { javascriptEnabled: true } } },
        ],
      },
      {
        test: /\.(woff|woff2|ttf)(\?t=\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              esModule: false,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: {
      name: 'runtime',
    },
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,
      maxSize: 2000000,
      minSize: 800000,
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NO_INTL: JSON.stringify(process.env.npm_config_nointl ? '1' : '0'),
        VERSION: JSON.stringify(Package.version),
      },
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '../app/index.html'),
      favicon: path.resolve(__dirname, '../favicon.ico'),
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      pageInitialProps: {
        dev: isDevEnv(),
        maxBytes: appConfig.MaxBytes
      }
    }),
    new AntdDayjsWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: path.join(__dirname, '../public/'), force: true },
      ],
    }),
  ],
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.json',
      '.css',
      '.woff',
      '.woff2',
      'ttf',
    ],
    alias: {
      '@app': path.join(__dirname, '../app/'),
      'react-dom': '@hot-loader/react-dom',
    },
  },
};

module.exports = commonConfig;
