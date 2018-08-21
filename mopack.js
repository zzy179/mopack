#!/usr/bin / env node
/* eslint no-console:0 ,prefer-promise-reject-errors :0 ,no-dynamic-require:0,global-require:0 */
const commander = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const nfs = require('fs');
const path = require('path');
const spawn = require('cross-spawn');
const cowsay = require('cowsay');
const begoo = require('begoo');
const {
  devModules,
  proModules,
  appDefaultCfg,
  webpackdevCfg,
  webpackproCfg,
  webpackutil,
  scripts,
} = require('./src/mopack.const');
const { createHtmlTemplate, createCommentTemplate } = require('./src/mopack.template');

let projectName;
let appCfg;
let useYarn;
const allDependencies = [];
const allDevDependencies = [];

// 创建commander实例
const program = new commander.Command('mopack')
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    projectName = name;
  });

// program
//   .option('-c, --css <css>', '指定css处理器语言');
program.option('-c, --config <configuration>', '指定配置文件');
program.on('--help', () => {
  console.log(`您必须指定 ${chalk.green('<project-directory>')}`);
  console.log(
    `${chalk.yellow(
      cowsay.say({
        text: 'HAPPY CODING!',
      }),
    )}`,
  );
  console.log();
});
// commander.help();
program.parse(process.argv);

// 项目名为必要项
if (typeof projectName === 'undefined') {
  console.log(`${chalk.red('命令非法...')}`);
  console.log(`${chalk.red('如果你想创建一个项目, < project - directory > 是必需的')}`);
  console.log('示例:');
  console.log(`mopack ${chalk.green('MyProject')}`);
  console.log();

  console.log();
  process.exit(1);
}

createApp(projectName);

function createApp(pname) {
  // 解析项目根目录
  const root = path.resolve(pname);
  const appName = path.basename(root);
  console.log(`${chalk.green(`将在${root}下生成项目:${appName}`)}`);

  // 指定模板文件路径路径
  const src = path.join(root, '/src');
  const proconfig = path.join(root, '/.proconfig');
  const pages = path.join(src, '/pages');
  const commons = path.join(pages, '/commons');
  // const components = path.join(pages, '/components');

  // fs.ensureDirSync(components);
  const packageJson = {
    appName,
    appVersion: '1.0.0',
    private: true,
  };
  // 如果指定了配置文件
  let userCfg = appDefaultCfg;
  if (program.config) {
    console.log(`${chalk.green('正在读取配置文件...')}`);
    userCfg = path.resolve(program.config);
  }
  const userCfgObj = require(userCfg);
  const defaultCfgObj = require(appDefaultCfg);
  const appcfg = Object.assign(defaultCfgObj, userCfgObj);
  // 生成项目各级目录
  fs.ensureDirSync(root);
  fs.ensureDirSync(src);
  fs.ensureDirSync(pages);
  fs.ensureDirSync(commons);
  fs.ensureDirSync(proconfig);
  // console.log(allDevDependencies);

  console.log(`${chalk.green('正在生成项目文件...')}`);
  // 生成页面文件目录
  if (typeof appcfg.pages === 'undefined') {
    appcfg.pages = ['index'];
    console.log(`${chalk.red('pages 配置项错误')}`);
    process.exit(1);
  }
  useYarn = !!appcfg.yarn;
  createPages(appcfg.pages, pages);
  // 写入npm scripts
  writeScripts(packageJson);
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson, null, 4));
  fs.writeFileSync(path.join(proconfig, '.app.conf'), JSON.stringify(appcfg, null, 4));
  fs.copySync(webpackutil, `${proconfig}/webpack.util.js`);
  fs.copySync(webpackdevCfg, `${proconfig}/webpack.config.dev.js`);
  fs.copySync(webpackproCfg, `${proconfig}/webpack.config.prod.js`);
  process.chdir(root);
  console.log(`${chalk.green('开始安装所有依赖')}`);
  console.log(`${chalk.green(begoo('正在安装依赖，这可能需要一会儿,请不要捉急！'))}`);

  installDepend()
    .then(() => {
      installDevDepend()
        .then(() => {
          console.log();
          console.log(`${chalk.green('依赖安装完成！')}`);
          console.log(`${chalk.green('您可以操作起来了!')}`);
          console.log(`${chalk.green(`使用方法: 运行 "cd ${projectName}" 进入项目目录`)}`);
          console.log(`${chalk.green('您可以运行以下命令:')}`);
          console.log(`${chalk.green('"npm run dev":启动开发服务器,默认打开index.html')}`);
          console.log(`${chalk.green('"npm run build":构建生产环境代码')}`);
          console.log(`${chalk.green(begoo('Happy Coding!', { avatar: 'monkey' }))}`);
        })
        .catch((err) => {
          console.log('安装失败', err);
        });
    })
    .catch((err) => {
      console.log('安装失败', err);
    });
}
function createPages(pages, pagespath) {
  pages.forEach((page) => {
    const pagePath = path.join(pagespath, `/${page}`);
    fs.ensureDirSync(pagePath);
    fs.ensureDirSync(`${pagePath}/components`);
    nfs.writeFileSync(`${pagePath}/index.js`, createCommentTemplate('javascript'));
    nfs.writeFileSync(`${pagePath}/index.css`, createCommentTemplate('style'));
    nfs.writeFileSync(`${pagePath}/${page}.html`, createHtmlTemplate(page));
  });
}
function installDepend() {
  allDependencies.push(...proModules);

  return new Promise((resolve, reject) => {
    const command = useYarn ? 'yarn' : 'npm';
    // 安装dependencies
    const args1 = [useYarn ? 'add' : 'install'].concat(allDependencies);
    const child1 = spawn(command, args1, { stdio: 'inherit' });

    child1.on('close', (code1) => {
      if (code1 !== 0) {
        reject({
          command: `${command} ${args1.join(' ')}`,
        });
        return;
      }

      resolve();
    });
  });
}

function installDevDepend() {
  allDevDependencies.push(...devModules);
  return new Promise((resolve, reject) => {
    const command = useYarn ? 'yarn' : 'npm';
    // 安装devDependencies
    const args2 = [useYarn ? 'add' : 'install', '--dev'].concat(allDevDependencies);
    const child2 = spawn(command, args2, { stdio: 'inherit' });
    child2.on('close', (code2) => {
      if (code2 !== 0) {
        reject({
          command: `${command} ${args2.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

function writeScripts(packageJson) {
  packageJson.scripts = scripts;
}
