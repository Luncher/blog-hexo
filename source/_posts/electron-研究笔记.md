---
title: electron-研究笔记
categories: web
date: 2016-05-07 22:37:24
---
使用`electron`有一阵子了，随着项目推进，需要研究的东西也逐渐多起来。总结了以下，问题主要出现在：  
- 跨平台兼容性  
- 新的功能需求  

<!-- more -->

=================

#### `electron` 渲染进程模拟浏览器环境  

`electron`渲染进程默认为`nodejs`环境，在里面你可以调用`require`引入第三方模块，但有时候我们想要的是一个真实的浏览器环境。`electron`需要做的配置如下：  

```javascript  

    var mainWindow = new BrowserWindow({
        resizable: true,
        width: size.width,
        height: size.height,
        title: 'HolaStudio',
        webPreferences:
        {
            nodeIntegration: false,
            preload: path.join(__dirname, 'tangide', 'expose-window-apis.js')
        }
    });

```  

创建`BrowserWindow`的时候指定`nodeIntegration`为`false`。  这样在`electron`内置浏览器里面不会有`module`和`require`全局变量。  

====================

#### 渲染进程与主进程之间的通信  
`electron`下主进程与渲染进程之间的通信主要有如下几种方式：  
- 使用`remote`模块  
- 使用`ipc`做进程间通信  

这里我选择了第二种方式：  
```javascript  

// In main process.
const ipcMain = require('electron').ipcMain;
ipcMain.on('asynchronous-message', function(event, arg) {
  console.log(arg);  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', function(event, arg) {
  console.log(arg);  // prints "ping"
  event.returnValue = 'pong';
});

// In renderer process (web page).
const ipcRenderer = require('electron').ipcRenderer;
console.log(ipcRenderer.sendSync('synchronous-message', 'ping')); // prints "pong"

ipcRenderer.on('asynchronous-reply', function(event, arg) {
  console.log(arg); // prints "pong"
});
ipcRenderer.send('asynchronous-message', 'ping');

```  
在渲染进程引入模块，都需要用`require`的方式，但是按照要求，渲染进程必须是一个真实的浏览器环境，所以需要通过其他方式来引入模块包。  

```javascript  
    preload: path.join(__dirname, 'tangide', 'expose-window-apis.js')
```  

该配置的作用在于：  
>界面的其它脚本运行之前预先加载一个指定脚本. 这个脚本将一直可以使用 node APIs 无论 node integration 是否开启. 脚本路径为绝对路径。  

`expose-window-apis.js`实现如下：  
```javascript  
//inner process communication
window.ipc = require('electron').ipcRenderer;  
```  

通过这种方式，渲染进程`window`对应引入了`ipc`模块，解决了渲染进程引入模块包的问题：）  

============================

#### mac系统下快捷键问题  

`Mac`系统下，默认的快捷键`Redo`、`Undo`、复制粘贴等不能使用，阅读了`electron`发现需要通过创建应用菜单的方式做一个映射。  
```  javascript

const Menu = require("menu");
     // Create the Application's main menu
    let template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: keysBinding["Edit"],
        submenu: [
            { label: keysBinding["Undo"], accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: keysBinding["Redo"], accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: keysBinding["Cut"], accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: keysBinding["Copy"], accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: keysBinding["Paste"], accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: keysBinding["Select All"], accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];

//注册菜单  
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

```  

=======================

#### 系统快捷键冲突问题  

开发者最常用到的快捷键一个是`F12`,打开开发者工具。 `F5`刷新当前网页：  
```javascript  
const globalShortcut = require('global-shortcut');   
registerShortcut();  
function registerShortcut() {
    function doRegister(cmd, callback) {
        globalShortcut.register(cmd, callback);
    }

    let registed = globalShortcut.isRegistered('F12');
    if(registed) return;

    doRegister('F12', function() {
        let win = BrowserWindow.getFocusedWindow();
        if(!win) return;
        win.webContents.toggleDevTools();
        console.log("toggleDevTools F12");
    });

    doRegister('F6', function() {
        let win = BrowserWindow.getFocusedWindow();
        if(!win) return;
        win.webContents.toggleDevTools();
        console.log("toggleDevTools F6");
    });

    doRegister('F5', function() {
        let win = BrowserWindow.getFocusedWindow();
        if(!win) return;
        win.reload();
        console.log("refresh");
    });

    return;
}

```   

正常情况下通过注册全局快捷键的方式能够满足绝大多数情况下的应用场景，但是使用过程中还是有如下问题：  
- `electron`注册了快捷键后，系统默认浏览器无法通过快捷键触发调式工具。  
- `windows`系统`electron`应用的`F12`按键无效。  

对于`windows`系统`F12`无效问题，`electron`官方貌似也没有一个好的解决方案。一个讨论的[帖子](https://github.com/electron/electron/issues/5066)。  

快捷键覆盖的问题，目前的解决办法如下：  
监听`blur`和`focus`事件，在`blur`事件下注消快捷键，在`focus`下重新注册监听快捷键。  

```javascript  
    mainWindow.on('blur', function() {
        let win = BrowserWindow.getFocusedWindow();
        if(win) return;
        globalShortcut.unregisterAll();
        console.log('blur');
    });

    mainWindow.on('focus', function() {
        registerShortcut();
        console.log('focus');
    });
```  

一个`electron`应用可能存在多个窗口，所以在主窗口触发`blur`事件的时候需要判断是不是所有`electron`都失去了焦点。  在这种情况下注消快捷键，以便系统浏览器能正常调式。  
