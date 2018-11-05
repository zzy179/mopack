这是一个对 webpack 定制化的多页面开发脚手架

本着约定大于配置的原则，mopack 将自动生成项目模板结构，并将使用默认规则配置 webpack

没啥特点，就是能用而已。

### 安装

`npm install mopack` 或者 `npm install mopack -g`

### 使用

#### 命令行

运行命令
`mopack <projectname>` ,其中 `projectname` 表示项目名称，然后 mopack 将在您的当前目录下生成项目。
您可以通过命令 `mopack -h` 查看帮助。

mopack 会将所有的配置文件生成至`.mopack`文件夹 可根据需要自行修改

**pages**

其中 mopack 将根据 pages 自动生成页面结构，并动态配置 webpack

**global**

指定 webpack 编译时注入的全局变量，默认全局变量为`APP_ENV`,值`DEV`表示开发环境,`PROD`表示生产环境

开发服务器端口

**sourceMap**

是否在构建时生成 sourceMap 文件
