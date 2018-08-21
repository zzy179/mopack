这是一个对webpack定制化的多页面开发脚手架

本着约定大于配置的原则，mopack将自动生成项目模板结构，并将使用默认规则配置webpack

没啥特点，就是能用而已。



在样式处理上
 - 默认使用css
 - 提供rem 到px 的自动转换，开发时写的px 会自动转换为rem,默认rem的根元素大小为10,且默认全属性转换，对于不想转换的px 值，只需要将单位 'px'写成大写'PX'即可
 - 自动添加浏览器前缀

### 安装

`npm install mopack` 或者 `npm install mopack -g`

### 使用

#### 命令行
运行命令 
`mopack <projectname>` ,其中 `projectname` 表示项目名称，然后mopack将在您的当前目录下生成项目。
您可以通过命令 `mopack -h` 查看帮助。

mopcak 也支持配置文件

mopack 会将所有的配置文件生成至`.proconfig`文件夹 可根据需要自行修改

参数：

`-c`: 指定配置文件路径


#### 配置文件

```javascript
module.exports = {
  pages: ['index', 'about'],// 页面
  port: 1234,//开发服务器端口
  global:{
    API:'123.123.123.123'
  },//编译时注入全局变量  默认值包含NODE_ENV
  sourceMap: false,//构建时是否生成 sourcemap文件
  cleanDist: false,//构建时是否清除构建目标文件夹的所有文件，默认情况下 每次构建都会自动生成以当前版本号命名的文件夹
  publicPath: '',//资源文件夹，一般无需设置，如果使用CDN服务 可设置此选项
  yarn: true,// 包管理器  默认使用yarn  设为false时 将使用npm
};


```
**pages**

其中mopack将根据pages 自动生成页面结构，并动态配置webpack

**global**

指定webpack 编译时注入的全局变量，默认全局变量为`NODE_ENV`,值`development`表示开发环境,`production`表示生产环境

**port**

开发服务器端口

**sourceMap**

是否在构建时生成sourceMap文件

**cleanDist**

每次构建是否清除旧文件，默认每次构建会提升一个版本号,初始版本号为 `1.0.0`，并生成以当前版本号命名的文件夹

**yarn**

指定包管理器，默认使用[yarn](https://yarnpkg.com/zh-Hans/),而且个人不推荐npm

