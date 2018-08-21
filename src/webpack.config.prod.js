process.env.NODE_ENV = 'development';
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const semver = require('semver');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MinicssExtractPluin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');
const autoprefixer = require('autoprefixer');
const pxtorem = require('postcss-pxtorem');
const util = require('./webpack.util');
const pkg = require('../package.json');

const app = JSON.parse(fs.readFileSync(path.join(__dirname, '/.app.conf')));

const thisVersion = semver.eq('1.0.0', pkg.appVersion) ? '1.0.0' : semver.inc(pkg.appVersion, 'minor');
pkg.appVersion = thisVersion;
app.appVersion = thisVersion;

const Plugins = [];
let outputDist = '../build';
const Entry = util.createEntry(app.pages);
Plugins.push(...util.createHtmlPlugins(app.pages, HtmlWebpackPlugin));
Plugins.push(new webpack.DefinePlugin(util.createDefinePlugins(app.global, 'development')));
Plugins.push(
  new MinicssExtractPluin({
    filename: '[name]/[name].[chunkHash:8].css',
  }),
);
Plugins.push(new BundleAnalyzerPlugin());
outputDist = app.cleanDist ? '../build' : `../build/${thisVersion}`;
fs.writeFileSync(path.join(__dirname, '/.app.conf'), JSON.stringify(app, null, 4));
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 4));
module.exports = {
  bail: true,
  mode: 'production',
  entry: Entry,
  output: {
    path: path.resolve(__dirname, outputDist),
    filename: './[name]/[name].[chunkHash:8].js',
    publicPath: app.publicPath,
  },
  module: {
    rules: [
      {
        test: /\.(css)$/,
        use: [
          MinicssExtractPluin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: () => [
                autoprefixer({
                  browsers: [
                    '>1%',
                    'last 4 versions',
                    'Firefox ESR',
                    'not ie < 9', // React doesn't support IE8 anyway
                  ],
                }),
                pxtorem({
                  rootValue: 10,
                  unitPrecision: 5,
                  propList: ['*'],
                  selectorBlackList: [],
                  replace: true,
                  mediaQuery: false,
                  minPixelValue: 12,
                }),
              ],
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, '../src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: ['env', 'react'],
            },
          },
        ],
      },
    ],
  },
  plugins: Plugins,
  optimization: {
    runtimeChunk: {
      name: 'manifest',
    },
    splitChunks: {
      cacheGroups: {
        // 提取公共文件
        commons: {
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          name: 'commons',
        },
        vendor: {
          // 将第三方模块提取出来
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10, // 优先
          enforce: true,
        },
      },
    },
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 7,
          warnings: false,
          output: {
            comments: false,
            beautify: false,
          },
        },
      }),
    ],
  },
  devtool: app.sourceMap ? 'source-map' : 'none',
};
