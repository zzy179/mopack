// process.env.NODE_ENV = 'development';
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
// const MinicssExtractPluin = require('mini-css-extract-plugin');

// const pxtorem = require('postcss-pxtorem');
const util = require("./webpack.util");

const app = JSON.parse(fs.readFileSync(path.join(__dirname, "/app.conf")));
const Plugins = [];
const Entry = util.createEntry(app.pages);

Plugins.push(...util.createHtmlPlugins(app.pages, HtmlWebpackPlugin));
Plugins.push(
  new webpack.DefinePlugin(util.createDefinePlugins(app.global, "development"))
);

module.exports = {
  mode: "development",
  entry: Entry,
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "./js/[name].js",
    publicPath: app.publicPath
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(css|sass|scss|less)$/,
            use: util.createCSSRule(app.css,'development')
          },
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            include: path.resolve(__dirname, "../src"),
            use: [
              {
                loader: require.resolve("babel-loader"),
                options: {
                  cacheDirectory: true,
                  babelrc: false,
                  presets: ["@babel/env", "@babel/react"],
                  plugins: app.css === "styled" ? ["styled-components"] : []
                }
              }
            ]
          },
          {
            test: /\.(png|jpg|jpeg|gif|bmp)$/,
            use: {
              loader: require.resolve("url-loader"),
              options: {
                limit: 10000,
                name: "images/[name].[ext]"
              }
            }
          },
          {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
              {
                loader: require.resolve("file-loader"),
                options: {
                  name: "assets/[name].[ext]"
                  // outputPath: './assets/[name].[ext]',
                }
              }
            ]
          },
          {
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve("file-loader"),
            options: {
              name: "assets/[name].[ext]"
            }
          }
        ]
      }
    ]
  },
  plugins: Plugins,
  // 开发环境下无需优化
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       // 提取公共文件
  //       commons: {
  //         chunks: 'initial',
  //         minChunks: 2,
  //         maxInitialRequests: 5,
  //         minSize: 0,
  //         name: 'commons',
  //       },
  //       vendor: {
  //         // 将第三方模块提取出来
  //         test: /node_modules/,
  //         chunks: 'initial',
  //         name: 'vendor',
  //         priority: 10, // 优先
  //         enforce: true,
  //       },
  //     },
  //   },
  // },
  devServer: {
    host: "0.0.0.0",
    port: app.port || 1234,
    overlay: true,
    disableHostCheck: true,
    open: true,
    useLocalIp: true
  },
  devtool: "inline-source-map"
};
