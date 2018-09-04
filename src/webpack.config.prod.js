// process.env.NODE_ENV = "development";
const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const semver = require("semver");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MinicssExtractPluin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const CleanWebpackPlugin = require("clean-webpack-plugin");

// const pxtorem = require("postcss-pxtorem");
const util = require("./webpack.util");
const pkg = require("../package.json");

const app = JSON.parse(fs.readFileSync(path.join(__dirname, "/app.conf")));

const thisVersion = semver.inc(pkg.appVersion, "minor");
pkg.appVersion = thisVersion;
app.appVersion = thisVersion;

const Plugins = [];
let outputDist = "../build";
const Entry = util.createEntry(app.pages);
Plugins.push(...util.createHtmlPlugins(app.pages, HtmlWebpackPlugin));
Plugins.push(
  new webpack.DefinePlugin(util.createDefinePlugins(app.global, "development"))
);
Plugins.push(
  new MinicssExtractPluin({
    filename: "[name]/[name].[chunkHash:8].css"
  })
);
Plugins.push(new BundleAnalyzerPlugin());
if (app.cleanDist) {
  Plugins.push(new CleanWebpackPlugin([path.join(__dirname,'../build')],{
      allowExternal:true
  }));
}
outputDist = app.cleanDist ? "../build" : `../build/${thisVersion}`;
fs.writeFileSync(
  path.join(__dirname, "/app.conf"),
  JSON.stringify(app, null, 4)
);
fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 4));
module.exports = {
  bail: true,
  mode: "production",
  entry: Entry,
  output: {
    path: path.resolve(__dirname, outputDist),
    filename: "./[name]/[name].[chunkHash:8].js",
    publicPath: app.publicPath
  },
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(css|sass|scss|less)$/,
            use: util.createCSSRule(app.css,'production',MinicssExtractPluin)
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
                  plugins: app.css === "styled"
                    ? [
                      "styled-components",
                      "@babel/plugin-syntax-dynamic-import"
                    ]
                    : [
                      "@babel/plugin-syntax-dynamic-import"
                    ]
                }
              }
            ]
          },
          {
            test: /\.(png|jpg|jpeg|gif|bmp)$/,
            use: {
              loader: require.resolve("url-loader"),
              options: {
                limit: 100,
                name: "images/[name].[hash:8].[ext]",
                publicPath: "../"
              }
            }
          },
          {
            test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
            use: [
              {
                loader: "file-loader",
                options: {
                  name: "static/[name].[ext]",
                  publicPath: "../"
                }
              }
            ]
          },
          {
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve("file-loader"),
            options: {
              name: "static/[name].[ext]"
            }
          }
        ]
      }
    ]
  },
  plugins: Plugins,
  optimization: {
    runtimeChunk: {
      name: "manifest"
    },
    splitChunks: {
      cacheGroups: {
        // 提取公共文件
        commons: {
          chunks: "initial",
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          name: "commons"
        },
        vendor: {
          // 将第三方模块提取出来
          test: /node_modules/,
          chunks: "initial",
          name: "vendor",
          priority: 10, // 优先
          enforce: true
        }
      }
    },
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          ecma: 7,
          warnings: false,
          output: {
            comments: false,
            beautify: false
          }
        }
      })
    ]
  },
  devtool: app.sourceMap ? "source-map" : "none"
};
