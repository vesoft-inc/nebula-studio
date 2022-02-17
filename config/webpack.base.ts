import HtmlWebpackPlugin from 'html-webpack-plugin';
import path, { resolve } from 'path';
import webpack, { Configuration } from 'webpack';
import Package from '../package.json';
import AntdDayjsWebpackPlugin from 'antd-dayjs-webpack-plugin';

const commonConfig: Configuration = {
  entry: {
    app: [path.join(__dirname, '../app/index.tsx')],
  },
  module: {
    exprContextCritical: true,
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              configFile: path.join(__dirname, '../tsconfig.json'),
            },
          },
        ],
        include: path.join(__dirname, '../app'),
      },
      {
        test: /\.(js|jsx)$/,
        use: ['babel-loader'],
        include: path.join(__dirname, '../app'),
      },
      {
        test: /\.less/,
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
                  'table-header-cell-split-color': '#E9EDEF'
                }
              }
            },
          },
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
            }
          }
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
    }
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
      template: path.join(__dirname, '../app-v2/index.html'),
      favicon: resolve(__dirname, '../favicon.ico'),
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new AntdDayjsWebpackPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.woff', '.woff2', 'ttf'],
    alias: {
      '#app': path.join(__dirname, '../app/'),
      '@appv2': path.join(__dirname, '../app-v2/'),
      'react-dom': '@hot-loader/react-dom',
    },
  },
};


export default commonConfig;
