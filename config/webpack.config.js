const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MinicssExtractPluin = require("mini-css-extract-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
	.BundleAnalyzerPlugin;
const app = require("./app.json");

const cssRegex = /\.css$/;
const sassRegex = /\.(css|scss|sass)$/;
module.exports = env => {
	const isProd = env === "prod" || env === "test";
	const isDev = env === "dev";
	const getCssloaders = function() {
		const loaders = [
			isDev && { loader: require.resolve("style-loader") },
			isProd && {
				loader: MinicssExtractPluin.loader,
				options: { publicPath: "../" }, //这里配置生成的css 文件里的静态资源的路径，这里是因为 最终生成在styles 文件下
			},
			{
				//将 CSS 转化成 CommonJS 模块
				loader: require.resolve("css-loader"),
				options: {
					importLoaders: 1,
					sourceMap: isDev,
				},
			},
			{
				loader: "postcss-loader",
				options: {
					ident: "postcss",
					plugins: () => [
						//https://github.com/csstools/postcss-preset-env
						require("postcss-preset-env")({
							autoprefixer: {
								flexbox: "no-2009",
							},
							stage: 3,
						}),
					],
					sourceMap: isDev,
				},
			},
			app.csslang === "sass" && {
				// 将 Sass 编译成 CSS
				loader: "sass-loader",
				options: {
					sourceMap: isDev,
				},
			},
		].filter(Boolean);

		return loaders;
	};

	const getEnvStringifed = function() {
		const defs = {};
		const e = app.env[env];
		for (const key in e) {
			if (e.hasOwnProperty(key)) {
				defs[key] = JSON.stringify(e[key]);
			}
		}
		return defs;
	};

	const getHtmlPlugins = function() {
		return Object.keys(app.pages).map(page => {
			return new HtmlWebpackPlugin(
				Object.assign(
					{},
					{
						inject: true,
						filename: `${page}.html`,
						template: path.join(
							__dirname,
							"../",
							path.parse(app.pages[page]).dir + "/index.html",
						),
						chunks: [page],
					},
					isProd
						? {
								minify: {
									removeComments: true,
									collapseWhitespace: true,
									removeRedundantAttributes: true,
									useShortDoctype: true,
									removeEmptyAttributes: true,
									removeStyleLinkTypeAttributes: true,
									keepClosingSlash: true,
									minifyJS: true,
									minifyCSS: true,
									minifyURLs: true,
								},
						  }
						: undefined,
				),
			);
		});
	};

	const getEntrys = function() {
		const entry = {};
		Object.keys(app.pages).forEach(page => {
			return (entry[page] = path.join(
				__dirname,
				"../",
				path.parse(app.pages[page]).dir + "/app.js",
			));
		});
		return entry;
	};

	return {
		//模式 三种模式：development开发模式 production 生产模式 none ref:https://webpack.docschina.org/concepts/mode/
		//默认有三种环境 prod  生产环境 dev  开发环境  test  测试环境
		mode: isDev ? "development" : "production",
		//入口文件，如果是多页 添加对应的chunkName 和入口文件
		entry: getEntrys(),
		output: {
			//代码生成到那个文件夹，如果是开发模式，代码在 内存里没有真实文件生成
			path: isProd ? path.resolve(__dirname, "../build") : undefined,
			//入口文件对应的最终生成的文件的名称
			//开发环境无需hash 值
			//如果是多页  即使开发环境也需要name 去区分不同的chunk 否则 后面的会覆盖前面的
			filename: isProd
				? "scripts/[name].[chunkhash:8].js"
				: "js/[name].bundle.js",
			chunkFilename: isProd
				? "scripts/[name].[chunkhash:8].js"
				: "js/[name].bundle.js",
			publicPath: "",
		},
		devtool: isDev
			? "cheap-module-eval-source-map"
			: app.sourceMap
			? "source-map"
			: false,
		//配置路径别称，这里用@代表 src 目录
		//对应的在js 中使用时直接当做src 即可 在 sass 内部使用时  需要使用 ~@
		//如果需要增加别的别称 参考如下即可
		resolve: Object.assign(
			{},
			{
				alias: {
					"@": path.resolve(__dirname, "../src"),
				},
			},
		),
		module: {
			//加载各类资源的规则
			rules: [
				app.lint && {
					test: /\.(js|mjs|jsx)$/,
					enforce: "pre",
					use: [
						{
							options: {
								formatter: require.resolve("react-dev-utils/eslintFormatter"),
								eslintPath: require.resolve("eslint"),
								quiet: true,
								emitWarning: isDev,
								failOnError: isProd,
								configFile: path.join(__dirname, ".eslintrc"),
							},
							loader: require.resolve("eslint-loader"),
						},
					],
					include: path.resolve(__dirname, "../src"),
				},
				{
					//只使用第一个匹配的规则
					oneOf: [
						//css 资源处理
						{
							test: app.csslang === "sass" ? sassRegex : cssRegex,
							//loader 是从后往前执行的
							//在开发模式下，css会通过js 插入到style节点中，在生产环境下，会单独打包出css 文件
							use: getCssloaders(),
						},
						//处理js 资源
						{
							test: app.isReactApp ? /\.(js|jsx)$/ : /\.js$/,
							//不处理node_modules 中的文件
							exclude: /node_modules/,
							//只处理src 下自己的代码文件
							include: path.resolve(__dirname, "../src"),
							use: [
								{
									loader: require.resolve("babel-loader"),
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
								loader: require.resolve("url-loader"),
								options: {
									//大小低于limit的图片将被生成base64 编码的图片直接插入到css 文件中
									limit: 10000,
									name: isDev
										? "assets/[name].[ext]"
										: "assets/[name].[hash:8].[ext]",
								},
							},
						},
						{
							loader: require.resolve("file-loader"),
							exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
							options: {
								name: isDev
									? "assets/[name].[ext]"
									: "assets/[name].[hash:8].[ext]",
							},
						},
					],
				},
			].filter(Boolean),
		},
		plugins: [
			//页面 每个页面(html)都需要配置一个HtmlWebpackPlugin
			...getHtmlPlugins(),
			//doesnt work
			// isProd && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime/]),
			new webpack.DefinePlugin(getEnvStringifed()),
			isProd &&
				new MinicssExtractPluin({
					// Options similar to the same options in webpackOptions.output
					// both options are optional
					filename: "styles/[name].[contenthash:8].css",
					chunkFilename: "styles/[name].[contenthash:8].chunk.css",
				}),
			//清除打包文件
			isProd &&
				new CleanWebpackPlugin([path.join(__dirname, "../build")], {
					allowExternal: true,
				}),
			//打包性能
			isProd && new BundleAnalyzerPlugin(),
		].filter(Boolean),
		optimization: isProd
			? {
					minimize: true,
					minimizer: [new OptimizeCSSAssetsPlugin({})],

					splitChunks: {
						cacheGroups: {
							commons: {
								chunks: "initial",
								minChunks: 2,
								maxInitialRequests: 5, // The default limit is too small to showcase the effect
								minSize: 0, // This is example is too small to create commons chunks
							},
							vendor: {
								test: /node_modules/,
								chunks: "initial",
								name: "vendor",
								priority: 10,
								enforce: true,
							},
						},
					},
					//提取运行时
					runtimeChunk: {
						name: "runtime",
					},
			  }
			: {},
		devServer: isDev
			? {
					host: "0.0.0.0", //使用这个host 表示可以再除本机外的设备上访问
					overlay: true,
					disableHostCheck: true,
					open: true, //浏览器自动打开,
					useLocalIp: true,
					historyApiFallback: true, //history route
			  }
			: undefined,
	};
};
