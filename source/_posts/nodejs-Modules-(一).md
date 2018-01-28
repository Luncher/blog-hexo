---
title: nodejs-Modules-(一)
categories: server
date: 2015-12-07 10:37:01
---
  Nodejs拥有一套简单的模块加载系统，在Nodejs里面文件和模块是一一对应的关系。例如：`foo.js`加载了同一个目录下的`circle.js`文件。  


`circle.js`文件内容：  
``` javascript  
const PI = Math.PI;  
exports.area = (r) => PI*r*r;  
exports.circumference = (r) => 2*PI*r;  
```  

`foo.js`文件内容：  
```javascript  
const circle = require('./circle.js');  
console.log(`the area of radius 4 is ${circle.area(4)}`);

```    

`circle`模块导出了`area`和`circumference`函数，为了根模块能够引用到它，你可以把它们添加到`exports`对象上。  

**模块内部的局部变量都是私有的,  因为每个模块都被封装在一个函数内部。**上面的例中`PI`就是属于`circle`模块的局部变量。  

**如果你希望导出一个函数或者一个对象，你应该把该函数或者对象赋值给`module.exports`而不是`exports`**。  

---  

### 访问主模块  
如果一个模块直接通过`Node.js`启动运行，`require.main`将会设置为该模块。你可以通过如下方式测试当前模块是否为主模块：  
```javascript  
console.log(require.main === module);
```  
举个例子，对于`foo.js`文件，如果通过`nodejs foo.js`运行，那么该测试将会输出`true`, 如果通过`require('foo.js')`，测试将输出`false`。  
由于每个`module`对象都有一个`filename`属性，也可以通过`require.main.filename`查看主模块文件名。  

---  

### 模块加载  

当我们调用`require`加载外部文件的时候，将会调用`require.resolve`函数。具体的解析规则如下：  

```  
在Y目录下的模块调用require(X)  
- 1. 如果X是一个内建核心模块，  
   a. 返回该模块  
   b. 停止执行  

- 2. 如果X使用`./`或者`/`或者`../`开头  
   a. 把(Y+X)作为文件路径来加载(LOAD_AS_FILE)      
   b. 把(Y+X)作为目录路径来加载(LOAD_AS_DIRECTORY)    

- 3. 加载`node_modules(X, dirname(Y))`(LOAD_NODE_MODULES)    

- 4. 抛出`not found`异常  

```  

**LOAD_AS_FILE(x)**  
- A. 如果`x`是一个文件则把`x`作为`javascript`文本文件加载。  停止  
- B. 如果`x.js`是一个文件则把`x.js`作为`javascript`文本文件加载。 停止  
- C. 如果`x.json`是一个文件则把`x.json`作为一个`javascript`对象来解析。 停止  
- D. 如果`x.node`是一个文件则把`x.node`作为一个二进制插件。停止  

**LOAD_AS_DIRECTORY(x)**  
- A. 如果`x/package.json`是一个文件  
   a. 解析`package.json`读取`main`字段.  
   b. let m = x + `main`字段值  
   c. LOAD_AS_FILE(m)   
- B. 如果`x/index.js`是一个文件，则把`x/index.js`作为`javascript`文本文件加载。 停止  
- C. 如果`x/index.json`是一个文件，则把`x/index.json`作为`js`对象来解析。停止  
- D. 如果`x/index.node`是一个文件， 则把`x/index.node`作为二进制插件加载。停止  

**NODE_MODULES_PATHS(START)**  
- 1. let PARTS = path split(START)  
- 2. let I = count of PARTS - 1  
- 3. let DIRS = []  
- 4. while I >= 0,  
   a. if PARTS[I] = "node_modules" CONTINUE  
   c. DIR = path join(PARTS[0 .. I] + "node_modules")  
   b. DIRS = DIRS + DIR    
   c. let I = I - 1  
- 5. return DIRS  

---  

### 模块缓存  
模块在首次加载完毕之后会被缓存， 这意味着`require('foo.js')`不会导致`foo.js`被执行两次。 如果希望多次执行模块代码，可以导出`export`一个函数，该函数负责执行代码。  

#### 模块缓存警告  
+ 1、模块基于被解析的名字来缓存，由于同一个模块在不同目录被加载可能会得到不同的文件名，所以`require('foo')`，不能保证总是得到相同的对象。  

+ 2、在一些大小写不敏感的系统，不同的文件名被系统指向同一个文件，但是缓存模块依旧认为它们是两个不同的模块，也就是说，`require('foo')`和`require('FOO')`将会得到两个不同的对象，而不考虑，`foo`和`FOO`是否是同一个文件。  

---  

### 核心模块  
`Nodejs`内置几个被打成二进制形式的包。内置模块将会被优先加载，例如`require('http')`将会加载内置的`http`模块，即使有一个文件名也为`http`。  

**需要注意的是：核心模块在安装的时候已经和`node`可执行程序打包到一起了。**  

--- 

### 循环加载  

考虑有这样几个模块：  
`a.js`  
```javascript  
console.log('a starting');
exports.done = false;
const b = require('./b.js');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');  
```  

`b.js`  
```javascript
console.log('b starting');
exports.done = false;
const a = require('./a.js');
console.log('in b, a.done = %j', a.done);
exports.done = true;
console.log('b done');
```

`main.js`
```javascript  
console.log('main starting');
const a = require('./a.js');
const b = require('./b.js');
console.log('in main, a.done=%j, b.done=%j', a.done, b.done);
```

但`main.js`开始加载`a.js`而，`a.js`开始加载`b.js`，而`b.js`又开始加载`a.js`。为了阻止无限循环模块加载，一个**未加载完成的a模块**将会返回给`b.js`，接着`b.js`模块加载完毕，把`exports`对象返回给`a.js`。  

于此同时`main.js`两个模块都加载完毕了，运行`main.js`输出如下： 

```javascript  
$ node main.js
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done=true, b.done=true
```

---  

### 文件模块   
如果指定的文件名文件不存在，那么`Node.js`将会尝试加载不同后缀名的文件主要有：(`.js`, `.json`, `.node`)。  
`.js`后缀被解析为`js`文本文件，`.json`文件被解析文`js`对象，`.node`文件被解析为`node`插件，通过`dlopen`加载。  

---  

### 文件夹作为模块    
使用文件夹是一个非常便捷的代码管理方式，提供一个统一的外部入口，供外部调用该文件夹。主要有三种方式可以达到该目的：  

- 在文件夹的根目录建立一个`package.json`，使用`main`字段指定入口脚本文件，例如：  
```javascript  
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```  

在当前目录下有一个`some-library`文件夹，此时调用`require('./some-library')`将会尝试加载`./some-library/lib/some-library.js`文件。如果`main`字段指定的文件找不到，`Node.js`将会报错：  
```
Error: Cannot find module 'some-library'
```  

如果在该文件夹下没有`package.json`,`Node.js`将会尝试加载：  
- ./some-library/index.js  
- ./some-library/index.json  
- ./some-library/index.node  

---  

### 从`node_modules`文件夹加载  

如果传递给`require`的参数既不是内置模块，模块名称也不是以`./`、`/`、`../`开头，那么`Node.js`将会尝试寻找父目录下的`node_modules`文件夹。如果没有找到就再往上面一层查找，直到退回系统根目录。  

举个例子：文件`/home/ry/project/foo.js`，调用`require('bar.js')`，将会查找以下`node_modules`文件夹：  
- `/home/ry/project/node_modules/bar.js`  
- `/home/ry/node_modules/bar.js`     
- `/home/node_modules/bar.js`    
- `/node_modules/bar.js`  

---  

### 从全局文件夹加载模块  

`NODE_PATH`环境变量被配置为用一系列冒号分隔的绝对路径，`Nodejs`将会去这些目录下寻找模块。`NODE_PATH`最初在前面的一些模块加载方法都没有出现的时候使用，现在慢慢变得没那么必要了。  
除此之外`Node.js`还会查找以下目录：  
- $HOME/.node_modules  
- $HOME/.node_libraries  
- $PREFIX/lib/node_modules  

`$HOME`为当前用户的根目录，`$PREFIX`通过`node_prefix`来配置。  

**基于一些历史方面的原因，建议把模块安装在本地的`node_modules`文件夹下，这一加载速度最快也最可靠。**  

---  

### 模块包装  

在模块执行之前，`Node.js`把它包装成一个函数的形式，看起来像这样：  
```javascript  
(function (exports, require, module, __filename, __dirname) {
// Your module code actually lives in here
});  
```  

通过这种做法带来以下好处：  
- 保证被`let`,`var`,`const`定义的变量作用域局限于模块内部，而不是全局变量。  
- 包装了几个看起来类似于全局变量来指定该模块，例如：  
  + `module`和`exports`变量，用于从该模块导出数据到其他模块。  
  + `__filename`,`__dirname`,指向该模块的文件绝对路径以及文件夹路径。  

---  

### `module`对象  

- module.children   
一个数组指定了当前模块引用的其他模块。  

- module.exports  
一个对象，用于导出数据，如果希望导出的是一个函数，则应该给`module.exports`赋值，而不是给`exports`。否则会造成意想不到的后果。

- exports
一个对象，最初指向`module.exports`，如果你给它赋值，它将会指向对象，而不是最初的`module.exports`。  
类似于：  

```javascript  
function require(...) {
  // ...
  ((module, exports) => {
    // Your module code here
    exports = some_func;        // re-assigns exports, exports is no longer
                                // a shortcut, and nothing is exported.
    module.exports = some_func; // makes your module export 0
  })(module, module.exports);
  return module;
}
```  

- module.filename  
模块的绝对路径名称  

- module.id  
模块`id`通常等于`module.filename`  

- module.loaded  
用于判断模块是否加载完毕，或者正在加载中。  

- module.parent  
指向首次加载本模块的模块。  

- module.require(id)  
 + id: String  
 + 返回一个module.exports导出的对象。  


  
