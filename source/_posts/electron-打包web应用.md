---
title: electron-打包web应用
categories: web
date: 2016-05-22 11:30:24
---
时下流行的web app打包工具主要有两个，一个是国内开发者主导的`nw.js`，另一个是国外大厂支撑的`electron`。对比了`nw.js`以及`electron`之后还是选择了`electron`，原因主要有以下几点：

+ 1、基于该工具已有广泛被使用的产品，如：`atom`、`vs code`等。
+ 2、在开发者中口碑比较好，有大公司参与进来，遇到问题，提个`issue`能很快得到响应。

下载基于`electron`打包的[HolaStudio](http://cdn.studio.holaverse.cn/dist/)。   

<!-- more -->

---  

### 使用`webpack`编译项目   

`HolaStudio`离线版本打包的时候需要把服务器、客户端打包到一个安装包内。所以第一步首先要把服务器代码混淆，为接下来打包做准备。  

构建工具选择了`webpack`, 关于构建工具没有做很细致的筛选，因为我都不熟悉：）。所以就听从朋友建议，选择了入了`webpack`的坑。  

关于`webpack`的使用，官方有详细的文档说明,`github`自行搜索。

`webpack`需要一个配置文件(`webpack.config.js`)，用来描述项目的环境，以及第三方插件的集成等信息：

```javascript

var webpack = require('webpack');
var path = require('path');
var fs = require('fs-extra');
var packageJSON = fs.readJsonSync('./package.json');

var nodeModules = {};
fs.readdirSync('./node_modules')
  .filter(function(x) {
    return ['.bin', '.npminstall'].indexOf(x) === -1;
  })
  .filter(function(y) {
    return !(y in packageJSON.devDependencies);
  })
  .forEach(function(mod) {
	nodeModules[mod] = 'commonjs ' + mod;
});

module.exports = {
    entry: './app.js',
    target: 'node',
    context: __dirname,
    node: {
        __dirname: false,
        __filename: false
    },  
    output: {
        path: path.join(__dirname, 'output'),
        filename: 'output.js',
        externals: nodeModules,
    },
    externals: nodeModules,
    plugins: [
        new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}}),
        new webpack.IgnorePlugin(/\.(css|less)$/)
    ]
}

```  
简要的说明：  
- entry: 指定项目的入口文件，即启动`node`服务指定的文件  
- target: 指定当前的编译环境为`node`, 其他选择有`web`、`webworker`等    
- context: 指定一个路径找到`entry`文件  
- node: 用于指定一些`nodejs`环境配置  __dirname=false 表示启用__dirname 变量(默认为'/'), __filename=false 表示启用__filename 变量(默认为'/index.js')。  
- output: 指定编译输出文件及目录  
- externals: 指定外部依赖库文件  
- plugins: `webpack`插件集成，这里主要用到了一个混淆插件  

运行 `webpack .` 会在当前目录下的`output` 文件夹得到编译输出文件。

---   
### 安装`electron`以及相关工具  

- 运行命令`npm i -g electron-prebuilt` 安装`electron`。

简要说说关于`electron`的设计理念：

`electron`打包的应用分为主进程和渲染进程，渲染进程使用`Chromium`来展示页面，主进程以类似创建窗口的方式创建网页。主进程具备调用系统相关服务的功能，主进程和渲染进程之间以`进程间通信`的方式交互。  更详细的`electron`[说明文档](https://github.com/electron/electron/blob/master/docs-translations/zh-CN/).  

*在打包`HolaStudio`的过程中，选择把`node`服务端代码放在主进程，编辑器放在一个渲染进程。*    

`electron`项目的构建目录结构：  
![图1](http://7xsec6.com1.z0.glb.clouddn.com/electron-release.png)  

在该目录下运行`electron .`即可调式`electron`应用。  

所以在启动`electron`应用的过程中，需要启动`node`后台的同时创建一个渲染窗口显示编辑器。  

```javascript

//处理windows 应用安装以及更新时刻的默认事件  
if(require('electron-squirrel-startup')) return;

var app = require('app');
var path = require('path');
var electron = require('electron');
var BrowserWindow = require('browser-window');
var globalShortcut = require('global-shortcut');

var mainWindow = null;
var webContents = null;

//所有窗口被关闭
app.on('window-all-closed', function() {
  // 在 OS X 上，通常用户在明确地按下 Cmd + Q 之前
  // 应用会保持活动状态
    if(process.platform != 'darwin') {
        app.quit();
    }
});

//当前应用准备退出
app.on('will-quit', function() {
    globalShortcut.unregisterAll();
});

// 当 Electron 完成了初始化并且准备创建浏览器窗口的时候
app.on('ready', function() {
    global.mainProcess = app;
    require('./hola_studio.js');
    registerShortcut();
});

//hola_studio 服务器发出`done`事件后，准备渲染编辑器界面
app.on('done', function(url) {
    var electronScreen = electron.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({resizable: true, width: size.width, height: size.height,
        title: 'HolaStudio'});
    mainWindow.loadURL(url);
    webContents = mainWindow.webContents;
    mainWindow.on('closed', function() {
        mainWindow = null;
        webContents = null;
    });
});

//注册快捷键用于打开开发者工具以及刷新当前页面
function registerShortcut() {
    function doRegister(cmd, callback) {
        globalShortcut.register(cmd, callback);
    }

    doRegister('F12', function() {
        var win = BrowserWindow.getFocusedWindow();
        win.webContents.toggleDevTools();
        console.log("toggleDevTools F12");
    });

    //windows 平台下`F12`按键按下收不到消息(貌似还没有解决方案)，所以写了一个替代按键
    doRegister('F6', function() {
        var win = BrowserWindow.getFocusedWindow();
        win.webContents.toggleDevTools();
        console.log("toggleDevTools F6");
    });

    doRegister('F5', function() {
        var win = BrowserWindow.getFocusedWindow();
        win.reload();
        console.log("refresh");
    });

    return;
}

```
如果之前有做过`MFC`、`QT`类GUI的开发，对`electron`这样的工作流程一定非常熟悉。  

---  

### 安装`electron-builder`工具来编译安装包   

`electron-builder`把几个不同平台的安装包编译工具集成到一起，得到一个统一的接口，方便使用。  

`electron-builder` 建议把构建目录分为两层，上面一层主要管理编译工具、构建所需的资源以及构建的输出，称之为dev 目录。下面一层则为以`electron`为入口的工程目录，称之为app 目录。  

`dev`目录预览：

![图3](http://7xsec6.com1.z0.glb.clouddn.com/electron-builder.png)

`app`目录预览：  
![图4](http://7xsec6.com1.z0.glb.clouddn.com/electron-release.png)

需要做的工作很简单：
- 安装构建工具(electron、electron-prebuilder)  
- 修改dev目录下`package.json`指定编译脚本  
- 修改app目录下`package.json`指定编译选项  
- 运行脚本编译安装包  

dev 目录下`package.json`预览:  

``` javascript  
{
  "name": "HolaStudio",
  "version": "0.0.1",
  "homepage": "http://studio.holaverse.cn",
  "description": "HolaStudio Release Version.",
  "scripts": {
    "dist": "npm run dist:linux && npm run dist:win",
    "dist:osx": "build --platform darwin --arch all -d",
    "dist:win": "build --platform win32 --arch all -d",
    "dist:linux": "build --platform linux --arch all -d"
  },
  "keywords": [
    "HolaStudio"
  ],
  "author": "holaverse Tech Inc.",
  "license": "ISC",
  "devDependencies": {
    "electron-builder": "^2.11.0",
    "electron-prebuilt": "^0.37.2"
  },
  "build": {
    "osx": {
      "title": "HolaStudio",
      "background": "build/background.png",
      "icon": "build/icon.icns",
      "icon-size": 128,
      "contents": [
        {
          "x": 355,
          "y": 125,
          "type": "link",
          "path": "/Applications"
        },
        {
          "x": 155,
          "y": 125,
          "type": "file"
        }
      ]
    }
  }
}

```  

- `scripts`字段指定`npm`编译不同平台的运行脚本。  
- `build`指定编译时载入的资源配置  

app 目录下`package.json`增加编译时配置选项(最新版本`electron-builder`已经把它提出到`dev`目录下的`package.json`)  
  ```javascript  
"build": {
    "asar": false,
    "iconUrl": "http://7xsec6.com1.z0.glb.clouddn.com/icon.ico",
    "app-bundle-id": "holaverse.studio",
    "app-category-type": "public.app-category.productivity"
  },
```  
- asar告诉打包工具，不要压缩资源文件，因为在`HolaStudio`运行过程中，需要频繁改动项目路径下文件。  
- iconUrl指定windows安装包`icon url`  
- app-bundle-id/public.app-category.productivity,mac平台下编译选项  

更详细的配置文档[请看这里](https://github.com/electron-userland/electron-builder/blob/master/docs/options.md)。  


成功打包了各种平台的安装包后，后续需要做的是阅读`electron`文档，在有新需求的时候能够很快的处理掉。  
