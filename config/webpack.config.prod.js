const path = require("path");
const webpack = require("webpack");
const util = require("./webpack.util");
const app = require("./app.conf");
const MinicssExtractPluin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
	.BundleAnalyzerPlugin;
module.exports = {
	//模式 三种模式：development开发模式 production 生产模式 none ref:https://webpack.docschina.org/concepts/mode/
	mode: "production",
	//入口文件，如果是多页，则使用数组配置
	entry: util.createEntry(app.pages),
	output: {
		//代码生成到那个文件夹，如果是开发模式，代码在 内存里没有真实文件生成
		path: path.resolve(__dirname, "../build"),
		//入口文件对应的最终生成的文件的名称
		filename: "./[name]/[name].[chunkHash:8].js",
	},
	module: {
		//加载各类资源的规则
		rules: [
			{
				//只使用第一个匹配的规则
				oneOf: [
					//css 资源处理
					{
						test: /\.(css|sass|scss)$/,
						//loader 是从后往前执行的
						//在开发模式下，css会通过js 插入到style节点中，在生产环境下，会单独打包出css 文件
						use: [
							{
								loader: MinicssExtractPluin.loader,
								options: {},
							},
							{
								//将 CSS 转化成 CommonJS 模块
								loader: "css-loader",
								options: {
									sourceMap: true,
								},
							},
							{
								loader: "postcss-loader",
								options: {
									config: {
										path: path.resolve(__dirname, "./.postcssrc.js"),
									},
								},
							},
							{
								// 将 Sass 编译成 CSS
								loader: "sass-loader",
								options: {
									sourceMap: true,
								},
							},
						],
					},
					//处理js 资源
					{
						test: /\.(js|jsx)$/,
						//不处理node_modules 中的文件
						exclude: /node_modules/,
						//只处理src 下自己的代码文件
						include: path.resolve(__dirname, "../src"),
						use: [
							{
								loader: "babel-loader",
								options: {
									//开启缓存，提高构件速度
									cacheDirectory: true,
									//使用babelrc 单独配置，具体配置看.babelrc 文件
									babelrc: false,
									configFile: path.resolve(__dirname, "./.babelrc"),
								},
							},
						],
					},
					//处理图片资源
					{
						test: /\.(png|jpg|jpeg|gif|bmp)$/,
						use: {
							loader: "url-loader",
							options: {
								//大小低于limit的图片将被生成base64 编码的图片直接插入到css 文件中
								limit: 20000,
								name: "images/[name].[ext]",
							},
						},
					},
					//处理字体SVG等资源
					{
						test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
						use: [
							{
								loader: "file-loader",
								options: {
									name: "assets/[name].[ext]",
								},
							},
						],
					},
					//处理非以上类型的资源
					{
						exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
						loader: "file-loader",
						options: {
							name: "assets/[name].[ext]",
						},
					},
				],
			},
		],
	},
	plugins: [
		...util.createHtmlPlugin(app.pages),
		new webpack.DefinePlugin(util.createGlobal(app.global, "PROD")),
		new MinicssExtractPluin({
			filename: "[name]/[name].[chunkHash:8].css",
		}),
		//清除打包文件
		new CleanWebpackPlugin([path.join(__dirname, "../build")], {
			allowExternal: true,
		}),
		//打包性能
		new BundleAnalyzerPlugin(),
	],
	optimization: {
		//提取运行时
		runtimeChunk: {
			name: "runtime",
		},
		splitChunks: {
			cacheGroups: {
				// 提取公共文件
				commons: {
					chunks: "initial",
					minChunks: 2,
					maxInitialRequests: 5,
					minSize: 0,
					name: "commons",
				},
				vendor: {
					// 将第三方模块提取出来
					test: /node_modules/,
					chunks: "initial",
					name: "vendor",
					priority: 10, // 优先
					enforce: true,
				},
			},
		},
		//压缩代码
		minimizer: [
			new UglifyJsPlugin({
				cache: true,
				parallel: true,
				sourceMap: true, // set to true if you want JS source maps
			}),
			new OptimizeCSSAssetsPlugin({}),
		],
	},
	devtool: app.sourceMap ? "source-map" : "none",
};
