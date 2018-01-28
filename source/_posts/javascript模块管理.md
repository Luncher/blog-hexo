---
title: jvascript模块管理
date: 2016-01-15 16:26:23
tags: AMD、CMD、commonjs
categories: web
---

代码模块化目的：

- 1、封装
- 2、代码复用

---

# 常见模块化解决反案

## 1、AMD(`Asynchronous Module Definition`)

  >`RequireJS`实现了AMD规范。

---

## 2、CMD(`Common Module Definition`)

  >`SeaJS`实现了`CMD`规范。

---

## 3、CommonJS Modules

  >`NodeJS`环境的模块加载实现了`CommonJS`规范。每个文件都是一个单独的模块，
有单独的作用域。模块之间通过global设置共享变量。`Browserify`可以让服务器代码跑在客户端。

  特点：

- 1、所有代码都运行在模块作用域，不会污染全局作用域。
- 2、模块可以多次加载，但是只会在第一次加载时运行一次，
    然后运行结果就被缓存了，以后再加载，就直接读取缓存结果。要想让模块再次运行，必须清除缓存。
- 3、模块加载的顺序，按照其在代码中出现的顺序。

常见问题：

- 清除缓存：
  delete require.cache[require.resolve('./b.js')]
模块按照绝对路径缓存，require.resolve返回模块的绝对路径。

- 解决互相依赖包含问题：
  CommonJS的做法是，一旦出现某个模块被"循环加载"，就只输出已经执行的部分，还未执行的部分不会输出。

总结：
> AMD、CMD主要用在浏览器端异步加载、COMMONJS主要用在服务器端的同步加载。
