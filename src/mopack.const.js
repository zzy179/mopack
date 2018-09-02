const path = require("path");

const devModules = [
    "autoprefixer",
    "@babel/core",
    "babel-loader",
    "css-loader",
    "mini-css-extract-plugin",
    "file-loader",
    "html-webpack-plugin",
    "style-loader",
    "url-loader",
    "webpack",
    "webpack-cli",
    "webpack-dev-server",
    "autoprefixer",
    "postcss-loader",
    "postcss-pxtorem",
    "@babel/preset-env",
    "@babel/preset-react",
    "uglifyjs-webpack-plugin",
    "webpack-bundle-analyzer",
    "semver",
    "clean-webpack-plugin"
];
const proModules = ["react", "react-dom", "@babel/polyfill"];
const appDefaultCfg = path.join(__dirname, "./app.config.default.js");
const webpackdevCfg = path.join(__dirname, "./webpack.config.dev.js");
const webpackproCfg = path.join(__dirname, "./webpack.config.prod.js");
const webpackutil = path.join(__dirname, "./webpack.util.js");
const cssLanguages = ['css','sass','less','styled'];
const scripts = {
    dev:
        "webpack-dev-server --mode development --config ./.proconfig/webpack.config.dev.js --hot --color --progress",
    build:
        "webpack --mode production --config ./.proconfig/webpack.config.prod.js"
};
module.exports = {
    devModules,
    proModules,
    appDefaultCfg,
    webpackdevCfg,
    webpackproCfg,
    webpackutil,
    scripts,cssLanguages
};
