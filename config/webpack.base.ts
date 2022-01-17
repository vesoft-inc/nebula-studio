import HtmlWebpackPlugin from 'html-webpack-plugin';
import path, { resolve } from 'path';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import Package from '../package.json'

const commonConfig = {
  entry: {
    app: [path.join(__dirname, '../app/index.tsx')],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
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
        test: /\.less/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
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
              name: "[path][name].[ext]",
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
    new webpack.HashedModuleIdsPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.woff', '.woff2', 'ttf'],
    alias: {
      '#app': path.join(__dirname, '../app/'),
      // fix this: https://github.com/react-component/table/issues/368
      'react-dom': '@hot-loader/react-dom'
    },
  },
};

if (process.env.npm_config_report) {
  commonConfig.plugins.push(new BundleAnalyzerPlugin());
}

export default commonConfig;
