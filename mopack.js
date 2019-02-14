#!/usr/bin / env node
/* eslint no-console:0 ,prefer-promise-reject-errors :0 ,no-dynamic-require:0,global-require:0 */

const chalk = require("chalk");
const path = require("path");
const myfs = require("fs-extra");
const spawn = require("cross-spawn");
const begoo = require("begoo");
const inquirer = require("inquirer");
const templateUtil = require("./template/template.util");

//默认环境变量
let app = {
	env: {
		development: {
			APP_ENV: "DEV",
		},
		production: {
			APP_ENV: "PROD",
		},
		test: {
			APP_ENV: "TEST",
		},
	},
	pages: [
		{ page: "index", entry: "./src/app.js", template: "./src/index.html" },
	],
};

//默认脚本命令
const scripts = {
	dev:
		"cross-env NODE_ENV=development webpack-dev-server  --config ./webpack.config.js --hot --color ",
	"build:test":
		"cross-env NODE_ENV=test webpack  --config ./webpack.config.js ",
	"build:prod":
		"cross-env NODE_ENV=production webpack  --config ./webpack.config.js",
};

//默认依赖
const deps = [
	"@babel/polyfill",
	"@babel/plugin-proposal-class-properties",
	"react-dev-utils",
	"autoprefixer",
	"@babel/core",
	"babel-loader",
	"css-loader",
	"mini-css-extract-plugin",
	"file-loader",
	"html-webpack-plugin",
	"style-loader",
	"url-loader",
	"fs-extra",
	"webpack",
	"webpack-cli",
	"webpack-dev-server",
	"postcss-loader",
	"@babel/preset-env",
	"uglifyjs-webpack-plugin",
	"webpack-bundle-analyzer",
	"clean-webpack-plugin",
	"optimize-css-assets-webpack-plugin",
	"postcss-preset-env",
	"eslint",
	"eslint-loader",
	"terser-webpack-plugin",
	"cssnano",
	"cross-env",
	"babel-plugin-transform-react-remove-prop-types",
	"babel-eslint",
];

const eslintrc = {};

const eslintrcJs = {
	extends: "eslint:recommended",
	env: {
		browser: true,
		commonjs: true,
		node: true,
		es6: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: "module",
	},
};

const eslintrcReact = {
	root: true,

	parser: "babel-eslint",
	plugins: ["import", "react"],
	extends: ["eslint:recommended", "plugin:react/recommended"],
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true,
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: "module",
		ecmaFeatures: {
			jsx: true,
		},
	},
	settings: {
		react: {
			version: "detect",
		},
	},
};

//默认babel 配置
const babelrc = {};
const babelPlugins = [];
const babelPresets = ["@babel/preset-env"];

const prompts = [];

let appPreConf = {
	appName: "myapp",
	csslang: "css",
	useYarn: false,
	isReactApp: false,
};

//选项设置
prompts.push(
	{
		type: "input",
		name: "appName",
		message: "what's is your app name",
		default: "myapp",
	},
	{
		type: "confirm",
		message: "use yarn?",
		name: "useYarn",
		default: false,
	},
	{
		type: "list",
		message: "which css language?",
		name: "csslang",
		choices: [
			{
				name: "css",
				value: "css",
			},
			{
				name: "sass",
				value: "sass",
			},
			{
				name: "styled-components",
				value: "styled",
			},
		],
		default: 0,
	},
	{
		type: "confirm",
		message: "is React App?",
		name: "isReactApp",
		default: false,
	},
);
inquirer.prompt(prompts).then(function(answer) {
	appPreConf = Object.assign(appPreConf, answer);
	app = Object.assign(app, appPreConf);

	const { appRootPath, srcPath, configPath, imagesPath } = resolvePath(app);
	// 得到最终的配置
	app = Object.assign({}, app, {
		configPath: configPath,
		appRootPath: appRootPath,
	});
	//如果使用sass ,需要单独安装node-sass
	if (app.csslang && app.csslang === "sass") {
		console.log(
			`${chalk.red(
				"您使用了sass,需要安装node-sass,详情可查看 https://github.com/sass/node-sass",
			)}`,
		);
	}

	createFiles(appPreConf.appName, appRootPath, srcPath, configPath, imagesPath);
	createPage(appPreConf.isSPA, srcPath);
	createPkg(appPreConf, appRootPath);
	createBabelrc(appPreConf, configPath);
	createConfigs(configPath);
	createApp(app);
});

function resolvePath(app) {
	const { appName } = app;
	const appRootPath = path.resolve(appName);
	// 解析出项目文件路径
	const srcPath = path.join(appRootPath, "/src");
	let configPath = path.join(appRootPath);

	// //如果是松垮模式 所有的配置文件将直接生成在项目根目录
	// if (app.loose) {
	// 	configPath = path.join(appRootPath);
	// }
	// const pagesPath = path.join(srcPath, "/pages");
	const imagesPath = path.join(srcPath, "/assets");
	return {
		appRootPath,
		srcPath,
		configPath,
		imagesPath,
	};
}

function createFiles(appName, appRootPath, srcPath, configPath, imagesPath) {
	console.log(`${chalk.green(`将在${appRootPath}下生成项目:${appName}`)}`);
	console.log();

	//生成项目目录文件
	myfs.ensureDirSync(appRootPath);
	myfs.ensureDirSync(configPath);
	myfs.ensureDirSync(imagesPath);
}

//生成模板页面
function createPage(isSPA, srcPath) {
	//是否为SPA的唯一区别是 是否将page 放在pages 下
	const pagePath = srcPath;
	myfs.ensureDirSync(pagePath);
	myfs.writeFileSync(`${pagePath}/app.js`, templateUtil.readTemplateFile("js"));
	myfs.writeFileSync(
		`${pagePath}/app.css`,
		templateUtil.readTemplateFile("css"),
	);
	myfs.writeFileSync(
		`${pagePath}/index.html`,
		templateUtil.readTemplateFile("html"),
	);
}

//生成bable配置
function createBabelrc(appPreConf, configPath) {
	babelPlugins.push([
		"@babel/plugin-proposal-class-properties",
		{ loose: true },
	]);
	//安装styled-components 需要的babel插件
	if (appPreConf.csslang === "styled") {
		babelPlugins.push("babel-plugin-styled-components");
	}

	//react
	if (appPreConf.isReactApp) {
		babelPresets.push("@babel/preset-react");
		deps.push(
			"@babel/preset-react",
			"babel-plugin-transform-react-remove-prop-types",
			"react",
			"react-dom",
		);
		babelrc["env"] = {
			production: {
				plugins: [
					"transform-react-remove-prop-types",
					{
						mode: "wrap",
						ignoreFilenames: ["node_modules"],
					},
				],
			},
		};

		Object.assign(eslintrc, eslintrcReact);
	} else {
		Object.assign(eslintrc, eslintrcJs);
	}

	myfs.writeFileSync(
		path.join(configPath, ".babelrc"),
		JSON.stringify(
			Object.assign(babelrc, {
				presets: babelPresets,
				plugins: babelPlugins,
			}),
			null,
			4,
		),
	);

	myfs.writeFileSync(
		path.join(configPath, ".eslintrc"),
		JSON.stringify(eslintrc, null, 4),
	);
}
//生成package.json文件
function createPkg(appPreConf, appRootPath) {
	if (appPreConf.isReactApp) {
		deps.push("react", "react-dom", "@babel/preset-react");
	}
	if (appPreConf.csslang === "sass") {
		deps.push("sass-loader");
	} else if (appPreConf.csslang === "styled") {
		deps.push("styled-components");
	}

	const pkj = {
		appName: appPreConf.appName,
		scripts: scripts,
		version: "0.1.0",
		private: true,
	};
	myfs.writeFileSync(
		path.join(appRootPath, "package.json"),
		JSON.stringify(pkj, null, 4),
	);
}

function createApp({ configPath, appRootPath, appName, useYarn } = {}) {
	myfs.writeFileSync(
		path.join(configPath, "app.json"),
		JSON.stringify(app, null, 4),
	);

	process.chdir(appRootPath);
	installDep(useYarn).then(() => {
		console.log();
		console.log(`${chalk.green("依赖安装完成！")}`);
		console.log(
			`${chalk.green(`使用方法: 运行 "cd ${appName}" 进入项目目录`)}`,
		);
		console.log(`${chalk.green("您可以运行以下命令:")}`);
		console.log(
			`${chalk.green('"npm run dev":启动开发服务器,默认打开index.html')}`,
		);
		console.log(`${chalk.green('"npm run build:prod":构建生产环境代码')}`);
		console.log(`${chalk.green('"npm run build:test":构建测试环境代码')}`);
		console.log(`${chalk.green(begoo("Happy Coding!", { avatar: "monkey" }))}`);
	});
}
function createConfigs(configPath) {
	myfs.copySync(path.resolve(__dirname, "./config"), path.resolve(configPath));
}

function installDep(useYarn) {
	console.log(`${chalk.green("开始安装所有依赖")}`);
	console.log(`${chalk.green(begoo("正在安装依赖包，这可能需要一会儿！"))}`);
	return new Promise((resolve, reject) => {
		let command;
		let args = [];

		if (useYarn) {
			command = "yarn";
			args = ["add"].concat(deps);
		} else {
			command = "npm";
			args = ["install", "--save"].concat(deps);
		}
		const child = spawn(command, args, {
			stdio: "inherit",
		});
		child.on("close", code => {
			if (code !== 0) {
				reject({
					command: `${command} ${args.join(" ")}`,
				});
				return;
			}
			resolve();
		});
	});
}

// createApp();
