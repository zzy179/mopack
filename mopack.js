#!/usr/bin / env node
/* eslint no-console:0 ,prefer-promise-reject-errors :0 ,no-dynamic-require:0,global-require:0 */

const chalk = require("chalk");
const path = require("path");
const myfs = require("fs-extra");
const spawn = require("cross-spawn");
const begoo = require("begoo");
const inquirer = require("inquirer");
const templateUtil = require("./template/template.util");
let app = {
	env: {
		dev: {
			APP_ENV: "DEV",
		},
		prod: {
			APP_ENV: "PROD",
		},
		test: {
			APP_ENV: "TEST",
		},
	},
};
const scripts = {
	dev:
		"webpack-dev-server --mode development --config ./.mopack/webpack.config.js --hot --color --env dev",
	"build:test":
		"webpack --mode production --config ./.mopack/webpack.config.js --env test",
	"build:prod":
		"webpack --mode production --config ./.mopack/webpack.config.js --env prod",
};

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
	"eslint-config-react-app",
	"eslint",
	"eslint-loader",
];
const babelPlugins = [];
const babelPresets = ["@babel/preset-env"];
// // 创建commander实例
// const program = new commander.Command("mopack")
// 	.arguments("<project-directory>")
// 	.usage(`${chalk.green("<project-directory>")} [options]`)
// 	.action(name => {
// 		projectName = name;
// 	});

// // program.option("-c, --css [engine]", "指定css语言");
// // program.option("-y, --yarn", "是否使用yarn作为包管理器"); //默认为false
// // program.option("-r, --react", "是否是React应用"); //默认为true
// program.on("--help", () => {
// 	console.log(`您必须指定 ${chalk.green("<project-directory>")}`);
// 	console.log(
// 		`${chalk.yellow(
// 			cowsay.say({
// 				text: "HAPPY CODING!",
// 			}),
// 		)}`,
// 	);
// 	console.log();
// });
// program.parse(process.argv);

// // 验证是否指定了项目名
// if (typeof projectName === "undefined") {
// 	console.log(`${chalk.red("命令错误，缺少项目名")}`);
// 	console.log(
// 		`${chalk.red("如果你想创建一个项目, < project - directory > 是必需的")}`,
// 	);
// 	console.log("示例:");
// 	console.log(`mopack ${chalk.green("MyProject")}`);
// 	console.log();

// 	console.log();
// 	process.exit(1);
// }

const prompts = [];
let appPreConf = {
	appName: "myapp",
	csslang: "css",
	useYarn: false,
	isReactApp: false,
	isSPA: true,
};
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
		name: "isReactApp",
		message: "is React App",
	},
	{
		type: "confirm",
		name: "isSPA",
		message: "only one page?",
	},
);
inquirer.prompt(prompts).then(function(answer) {
	appPreConf = Object.assign(appPreConf, answer);
	app = Object.assign(app, appPreConf);
	const { appRootPath, srcPath, configPath, imagesPath } = resolvePath(app);
	app = Object.assign({}, app, {
		configPath: configPath,
		appRootPath: appRootPath,
	});
	//如果使用sass ,需要单独安装node-sass
	if (app.csslang && app.csslang === "sass") {
		console.log(
			`${chalk.red(
				"您使用了sass,这需要您单独安装node-sass,建议您全局安装,详情可查看 https://github.com/sass/node-sass",
			)}`,
		);
	}

	createFiles(appPreConf.appName, appRootPath, srcPath, configPath, imagesPath);
	createPage(appPreConf.isSPA, srcPath);
	createPkg(appPreConf, appRootPath);
	createBabelrc(appPreConf, configPath);
	createConfigs(appRootPath);
	createApp(app);
});

function resolvePath(appPreConf) {
	const { appName } = appPreConf;
	const appRootPath = path.resolve(appName);
	// 解析出项目文件路径
	const srcPath = path.join(appRootPath, "/src");
	const configPath = path.join(appRootPath, "/.mopack");
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
	// myfs.ensureDirSync(pagesPath);
	myfs.ensureDirSync(imagesPath);
}

//生成模板页面
function createPage(isSPA, srcPath) {
	//是否为SPA的唯一区别是 是否将page 放在pages 下
	const pagePath = isSPA
		? srcPath
		: path.join(path.join(srcPath, "/pages"), `/${"index"}`);
	isSPA
		? Object.assign(app, {
				pages: {
					index: "/src/app.js",
				},
		  })
		: Object.assign(app, {
				pages: {
					index: "/src/pages/index/app.js",
				},
		  });
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
	//安装React需要的babel插件
	if (appPreConf.isReactApp) {
		babelPresets.push("@babel/preset-react");
	}
	myfs.writeFileSync(
		path.join(configPath, ".babelrc"),
		JSON.stringify(
			{
				presets: babelPresets,
				plugins: babelPlugins,
			},
			null,
			4,
		),
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
	};
	myfs.writeFileSync(
		path.join(appRootPath, "package.json"),
		JSON.stringify(pkj, null, 4),
	);
}

function createApp({ configPath, appRootPath, appName, useYarn } = {}) {
	console.log(configPath, appRootPath);

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
function createConfigs(appRootPath) {
	myfs.copySync(
		path.resolve(__dirname, "./config"),
		path.resolve(appRootPath, "./.mopack"),
	);
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
