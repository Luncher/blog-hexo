---
title: babel 研究- polyfill vs transpiler
date: 2020-03-22 15:23:46
tags: [babel,webpack]
categories: web
---

### 背景
`javascript` 语言发展迅速，各种新特性层出不穷。与之相对应的各个 `runtime` 的支持程度各不相同。通过 [Node Green](https://node.green/#ES2018) 可以发现最新版本（Node 14）几乎完全支持了 `ES2018`、`ES2019`、`ES2020` 所有的特性。而在浏览器端，需要面对的环境差异比较大，因为用户留存的问题又不得不支持。在这样一种大环境下，`bolyfill` 和 `transpiler` 的作用就凸显出来了。

<!-- more -->

---

### polyfill vs 语法转换(transpiler)

`polyfill` 和语法转换（`syntax transforms`）是两个不同的功能。他们的目的都是相同的：*项目代码中用了某些语言特性，但是这些特性在目标环境中没有实现*，就需要通过 `polyfill` 或者 `syntax transform` 来达到这个目的。

+ polyfill
> 模拟特定的 API 实现，就好像它已经默认被支持了似的，起到一个模拟标准库(`Standard Library`)的作用。

+ syntax transform
>语法转换强调的是转换语言特性，如：`arrow-function`、
>`decorators`、`class-properties` 等。把最终编译出来的代码替换成另外一个对应的代码片段。比如，[babel-plugin-transform-arrow-functions](https://babeljs.io/docs/en/babel-plugin-transform-arrow-functions) 就提供了 `箭头函数` 的语法转换能力。

---

### babel 对语法转换的支持

#### preset-env
`babel` 的语法转换能力主要依赖于 [`babel-preset-env`](https://babeljs.io/docs/en/babel-preset-env)。该模块的工作原理为：
> 1. 用户配置需要支持的环境（浏览器）版本信息
> 2. `preset` 借助 [browserslist](https://github.com/browserslist/browserslist)、[compat-table](https://github.com/kangax/compat-table)、[electron-to-chromium](https://github.com/Kilian/electron-to-chromium)等工具查询不同环境对语法能力的支持程度，提供对应的 `子模块` 来完成编译。换句话说，如果浏览器版本越老旧，需要的 `transform` `子模块` 也就越多，反之亦然。

`preset-env` 主要提供了如下一些转换转换功能：

```json
"dependencies": {
    "@babel/compat-data": "^7.9.0",
    "@babel/helper-compilation-targets": "^7.8.7",
    "@babel/helper-module-imports": "^7.8.3",
    "@babel/helper-plugin-utils": "^7.8.3",
    "@babel/plugin-proposal-async-generator-functions": "^7.8.3",
    "@babel/plugin-proposal-dynamic-import": "^7.8.3",
    "@babel/plugin-proposal-json-strings": "^7.8.3",
    "@babel/plugin-proposal-nullish-coalescing-operator": "^7.8.3",
    "@babel/plugin-proposal-numeric-separator": "^7.8.3",
    "@babel/plugin-proposal-object-rest-spread": "^7.9.0",
    "@babel/plugin-proposal-optional-catch-binding": "^7.8.3",
    "@babel/plugin-proposal-optional-chaining": "^7.9.0",
    "@babel/plugin-proposal-unicode-property-regex": "^7.8.3",
    "@babel/plugin-syntax-async-generators": "^7.8.0",
    ...
```

前面提到了，我们面对的是很多个浏览器环境，那么 `babel-preset` 是怎么知道需要支持什么浏览器的版本呢？

答案是通过 `preset` 配置项，如：
```json
{
    targets: {
        browsers: "last 2 versions"
    }
}

```
表示项目需要支持，每个浏览器的最后两个版本。（[last 2 version 的缺陷](https://jamie.build/last-2-versions) ) 其他的配置项可以参考 [preset-env](https://babeljs.io/docs/en/babel-preset-env) 文档。

#### stagx-n 语法转换

需要注意的是：
>It is important to note that @babel/preset-env does not support stage-x plugins.

`stag-x` 阶段的语法功能是没法提供转换的，所以对于：[class-properties](https://github.com/tc39/proposal-class-fields) 目前处于 `Stage 3`、和 [decorators](https://github.com/tc39/proposal-decorators) 目前处于 `Stage 2` 是不会默认转换的，所以需要我们安装额外的 `transform-plugin`。

#### 特定环境的语法转换

一些时候在特定环境下，需要特殊的转换模块，如：
+ [babel-preset-react](https://babeljs.io/docs/en/babel-preset-react) 负责转换 `react` 相关的语法，如：`jsx` 等

>延伸阅读：[babel typescript 编译转换](https://iamturns.com/typescript-babel/)

---

### babel 对 polyfill 的支持

#### 基础能力支持
说到 `polyfill` 不得不提的是 [corejs](https://github.com/zloirock/core-js)，`corejs` 扮演的是标准库的角色。绝大多数 `polyfill` 的能力由它来完成，只有一个例外：[regenerator-runtime](https://github.com/facebook/regenerator/blob/master/packages/regenerator-runtime/runtime.js)，用于转换 `generator` 函数。`babel 7.4` 之前的 `polyfill` 是通过 [babel-polyfill](https://babeljs.io/docs/en/babel-polyfill) 来完成，这个库其实没干其他事情，就是简单的把 `corejs` 和 `regenerator-runtime` 做了一层包装。`7.4` 版本之后该库已经不推荐使用了，原因在于：
>This behavior is deprecated because it isn't possible to use @babel/polyfill with different core-js versions


建议直接使用 `corejs` 和 `generator runtime`


#### 侵入式

"侵入式" `polyfill` 的能力通过 [babel-preset-env](https://babeljs.io/docs/en/babel-preset-env) 来完成（前面提到的语法转换也是通过它来完成）。 默认情况下 `preset-env` 的 `polyfill` 能力是关闭的，若要开启 [配置](https://babeljs.io/docs/en/babel-preset-env#useBuiltIns)方式有三种：

* entry 模式
> 在项目入口文件 `import` `corejs` 和 `generator runtime`（如果想用 `babel/polyfill` 则在这里替换）。注意只能 `import` 一次，否则可能会报错：）

`preset-env` 会依据环境不同，把 `import corejs` 这类的语法转换成 `import` 具体的文件，因为对于某一环境而言，一些 `polyfill` 是没有必要的。看一个例子：

```js
// webpack entry src/index.js
import 'core-js' // 引入 polyfill
function component() {
 //...
}
```

`webpack` 配置
```js

module.exports = {
  entry: './src/index.js',
    module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                "targets": {
                  browsers: 'last 2 versions'
                },
                "useBuiltIns": "entry",
                "corejs": "2"
              }]
            ],
            plugins: [cssModulePlugin]
          }
        }
      },
      //...
}

```
> 启用 `entry` 模式，目标环境是 `last 2 versions`，告诉 `babel` 使用的 `corejs2` 的版本。

`bundle.js` 输出：

```js
//src/index.js

/* harmony import */ var core_js_modules_es6_w//....
/* harmony import */ var core_js_modules_es6_w//....
/* harmony import */ var core_js_modules_es6_w//....
/* harmony import */ var core_js_modules_es6_w//....
/* harmony import */ var core_js_modules_web_t//....
/* harmony import */ var core_js_modules_web_t//....
/* harmony import */ var core_js_modules_web_i//....
/* harmony import */ var core_js_modules_web_i//....
/* harmony import */ var core_js_modules_web_d//....
/* harmony import */ var core_js_modules_web_d//....
/* harmony import */ var regenerator_runtime_r//....
/* harmony import */ var regenerator_runtime_r//....
/* harmony import */ var _button__WEBPACK_IMPO//....
/* harmony import */ var _astyle_less_modules_//....
/* harmony import */ var _astyle_less_modules_//....
function component() {
 //...
}

```

>可以看到，在项目入口处，`import corejs` 被替换成了 `import` 具体的子模块。

* `usage` 模式
> 项目中不需要显示的 `import corejs`，`babel` 会动态分析每个文件使用了哪些需要 `polyfill` 的特性，然后再自动 `import`。

看一个例子：

修改 `webpack` 配置：

```js
//...
presets: [
  ['@babel/preset-env', {
    "targets": {
      browsers: 'last 2 versions'
    },
    "useBuiltIns": "usage",
    "corejs": "2"
  }]
],
//...
```

修改项目入口文件：

```js

import button from './button'
import * as styles from './astyle.less'

function component() {
  //这里用到了 `Set` 这个特性
  const set = new Set([1, 2, 3, 4, 5])
  //...
}

```

编译结果 `bundle` 文件：

```js

/* harmony import */ var core_js_modules_es6_set__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! core-js/modules/es6.set */ "./node_modules/core-js/modules/es6.set.js");

function component() {
  //这里用到了 `Set` 这个特性
  const set = new Set([1, 2, 3, 4, 5])
  //...
}
```
> 可以看到，只对该文件使用到的特性（Set），`import` 了对应的polyfill。

+ `false`
> 当 `useBuildIn` 配置成 `false` 的时候，`preset-env` 将不会提供任何 `polyfill` 的功能。


#### 非侵入式

前面提到 `侵入式` 的 `polyfill` 实现，好处是方便快捷。只需要在项目的入口处（`entry` 模式）`import core-js` ，或者压根不需要 `import corejs` (`usage` 模式)，来达成 `polyfill` 的目的。但是这种实现是有代价的，因为存在 [global pollution](https://babeljs.io/docs/en/babel-plugin-transform-runtime#technical-details) 的问题。如果项目工程是类库，那么这种方案会污染该库的使用方。

这个使用，[babel-plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime) 这个库可以良好的解决这个问题。通过官网发现，`transform-runtime` 主要有两个目的：

1. 提供工具函数实现，如 `_extend` 等
2. 提供一个沙盒环境（`sandboxed environment`）在不污染全局作用域的前提下，达到 `polyfill` 的目的。

`transform-runtime` 通过 `corejs` 配置项来控制 `polyfill` 的支持能力，为了达成以上两个目的，还需要额外的模块来辅助：

+ @babel/runtime （当 `corejs` 配置为 `false`）
> 运行时的辅助函数库，`transform-runtime` 会把每个文件中自动生成的工具函数改成引入该模块，达到了减少代码体积的作用。同时包含了 `regenerator runtime` 的实现，用户通过 [regenerator](https://babeljs.io/docs/en/babel-plugin-transform-runtime#regenerator) 配置项，决定是否启用改功能。

+ @babel/runtime-corejs-2 (当 `corejs` 配置为 `2`)
> 等同于 corejs + `@babel/runtime`，需要注意的是，该模式只能 `polyfill` 全局变量，不能 `polyfill` `instance method`

+ @babel/runtime-corejs-2 (当 `corejs` 配置为 `3`)
> 等同于 `core-pure-js` + `@babel/runtime`，很好的解决了 `polyfill` `instance method` 等问题，详见 [update to `corejs@3`](https://github.com/babel/babel/pull/7646)

看个例子，以 `corejs: 2` 为例：

修改 `webpack` 配置：
```js
//...
options: {
presets: [
    ['@babel/preset-env']
    ],
    plugins: [
    cssModulePlugin,
    ["@babel/plugin-transform-runtime", {
    "corejs": 2
    }]
]
}
//...

```

编译输出：

```js
function component() {
  var set = new _babel_runtime_corejs2_core_js_set__WEBPACK_IMPORTED_MODULE_1___default.a([1, 2, 3, 4, 5]);
  var element = document.createElement('div');
}
```
>可以看到 `new Set` ，被替换成了 `polyfill` 实现。

---

### 总结


+ 对比分析了 `polyfill` 和语法转换的差异
+ `babel` 目前的语法转换通过 `preset-env` 来完成，但是 `stage-n` 的特性如 `class properties`等，只能自己安装插件来完成。
+ `babel` 对 `polyfill` 的支持主要依赖于 `corejs` 和 `regenerator runtime`。`7.4` 版本之后 `babel/polyfill` 已经不推荐使用了，取而代之的是：
    1. `preset-env` 的方式，但是存在 `pollute the global scope` 的问题
    2. `transform-runtime` 的方案，可以良好的解决这个问题，但是如果需要支持 `instance method` 等特性，需要使用 `babel/babel-runtim-corejs3`


---

### 参考

[babel-preset-env](https://babeljs.io/docs/en/babel-preset-env)
[babel-polyfill](https://babeljs.io/docs/en/babel-polyfill)
[babel-plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)
[core-js](https://github.com/zloirock/core-js)
[browserslist](https://github.com/browserslist/browserslist)
[the-difference-between-polyfill-and-transpiler](https://stackoverflow.com/questions/31205640/what-is-the-difference-between-polyfill-and-transpiler)
[usebuiltins-option](https://stackoverflow.com/questions/52625979/confused-about-usebuiltins-option-of-babel-preset-env-using-browserslist-integ)
