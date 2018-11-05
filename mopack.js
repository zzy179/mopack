/* eslint no-console:0 ,prefer-promise-reject-errors :0 ,no-dynamic-require:0,global-require:0 */
const commander = require("commander");
const chalk = require("chalk");
const cowsay = require("cowsay");
const path = require("path");
const myfs = require("fs-extra");
const spawn = require("cross-spawn");
const begoo = require("begoo");
const templateUtil = require("./template/template.util");
let projectName; //项目名
const scripts = {
	dev:
		"webpack-dev-server --mode development --config ./.mopack/webpack.config.dev.js --hot --color",
	build: "webpack --mode production --config ./.mopack/webpack.config.prod.js",
};
const devDeps = [
	"autoprefixer",
	"@babel/polyfill",
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
	"postcss-loader",
	"@babel/preset-env",
	"@babel/preset-react",
	"uglifyjs-webpack-plugin",
	"webpack-bundle-analyzer",
	"clean-webpack-plugin",
	"optimize-css-assets-webpack-plugin",
];
// 创建commander实例
const program = new commander.Command("mopack")
	.arguments("<project-directory>")
	.usage(`${chalk.green("<project-directory>")} [options]`)
	.action(name => {
		projectName = name;
	});

// program.option("-c, --css [engine]", "指定css语言");
// program.option("-y, --yarn", "是否使用yarn作为包管理器"); //默认为false
// program.option("-r, --react", "是否是React应用"); //默认为true
program.on("--help", () => {
	console.log(`您必须指定 ${chalk.green("<project-directory>")}`);
	console.log(
		`${chalk.yellow(
			cowsay.say({
				text: "HAPPY CODING!",
			}),
		)}`,
	);
	console.log();
});
program.parse(process.argv);

// 验证是否指定了项目名
if (typeof projectName === "undefined") {
	console.log(`${chalk.red("命令错误，缺少项目名")}`);
	console.log(
		`${chalk.red("如果你想创建一个项目, < project - directory > 是必需的")}`,
	);
	console.log("示例:");
	console.log(`mopack ${chalk.green("MyProject")}`);
	console.log();

	console.log();
	process.exit(1);
}

//如果使用sass ,需要单独安装node-sass
// if (program.css && program.css === "sass") {
// 	console.log(
// 		`${chalk.red(
// 			"您使用了sass,这需要您单独安装node-sass,建议您全局安装,详情可查看 https://github.com/sass/node-sass",
// 		)}`,
// 	);
// }

const appPathRoot = path.resolve(projectName);
console.log(`${chalk.green(`将在${appPathRoot}下生成项目:${projectName}`)}`);
console.log();

// 解析出项目文件路径
const srcPath = path.join(appPathRoot, "/src");
const proconfigPath = path.join(appPathRoot, "/.mopack");
const pagesPath = path.join(srcPath, "/pages");
const imagesPath = path.join(srcPath, "/images");
const mediaPath = path.join(srcPath, "/media");

//生成项目目录文件
myfs.ensureDirSync(appPathRoot);
myfs.ensureDirSync(proconfigPath);
myfs.ensureDirSync(pagesPath);
myfs.ensureDirSync(imagesPath);
myfs.ensureDirSync(mediaPath);

function createPage(page) {
	// const page = "index";
	const pagePath = path.join(pagesPath, `/${page}`);
	myfs.ensureDirSync(pagePath);
	myfs.writeFileSync(
		`${pagePath}/main.js`,
		templateUtil.readTemplateFile("js"),
	);
	myfs.writeFileSync(
		`${pagePath}/index.css`,
		templateUtil.readTemplateFile("css"),
	);
	myfs.writeFileSync(
		`${pagePath}/index.html`,
		templateUtil.readTemplateFile("html"),
	);
}

function createPkg() {
	const pkj = {
		appName: projectName,
		scripts: scripts,
	};
	myfs.writeFileSync(
		path.join(appPathRoot, "package.json"),
		JSON.stringify(pkj, null, 4),
	);
}

function createConfigs() {
	myfs.copySync(
		path.resolve(__dirname, "./config"),
		path.resolve(appPathRoot, "./.mopack"),
	);
}

function createApp() {
	createPage("index");
	createPkg();
	createConfigs();
	console.log(appPathRoot);

	process.chdir(appPathRoot);
	installDep().then(() => {
		console.log();
		console.log(`${chalk.green("依赖安装完成！")}`);
		console.log(
			`${chalk.green(`使用方法: 运行 "cd ${projectName}" 进入项目目录`)}`,
		);
		console.log(`${chalk.green("您可以运行以下命令:")}`);
		console.log(
			`${chalk.green('"npm run dev":启动开发服务器,默认打开index.html')}`,
		);
		console.log(`${chalk.green('"npm run build":构建生产环境代码')}`);
		console.log(`${chalk.green(begoo("Happy Coding!", { avatar: "monkey" }))}`);
	});
}

function installDep() {
	console.log(`${chalk.green("开始安装所有依赖")}`);
	console.log(`${chalk.green(begoo("正在安装依赖包，这可能需要一会儿！"))}`);
	return new Promise((resolve, reject) => {
		const command = "npm";
		// 安装devDependencies
		const args = ["install", "--save-dev"].concat(devDeps);
		const child = spawn(command, args, {
			stdio: "inherit",
		});
		child.on("close", code2 => {
			if (code2 !== 0) {
				reject({
					command: `${command} ${args.join(" ")}`,
				});
				return;
			}
			resolve();
		});
	});
}

createApp();
