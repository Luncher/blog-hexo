---
title: webpack 之 css-module
date: 2020-03-22 23:31:55
tags: [webpack,css]
categories: web
---

### 背景

`CSS-module` 的好处是可以避免 `namespace` 冲突的问题，尤其是项目工程比较庞大的情况。如果不采用 `css-module` 的形式 `className` 必须包含 `namespace` 的信息比如：`comp-domain-create-btn`。`css-module` 的好处显而易见。同时，开启 `css-module` 有一定的编译器性能开销。详细可以参阅 [css-module](https://github.com/css-modules/css-modules) 文档。这里想要谈论 `css-module` 和 `normal style` 兼容的问题，如果要使用第三方的 `css` 库（只有 `normal style` 的形式），和本项目共存（`css-modules`）这种情况就不可避免了。

<!-- more -->

---

### webpack 样式文件处理流程

假设项目使用 [less](http://lesscss.org/)。在 `webpack` 环境下，通常编译过程如下：

![e203015874c05577bfccbd94bd88a1b7.png](evernotecid://C266EE4A-E61E-46AC-A334-E5BBEC75D8FE/appyinxiangcom/18857699/ENResource/p43)

+ less-loader
>负责编译 `less` 语法，输出 `css` 语法的样式文件

+ css-loader 
>`resolve` 样式文件内所有的 `@import` 和 `url`，输出一个 `webpack` `module`，本身对`css` 样式内容不做任何的调整。

+ style-loader
>负责把 `css` 样式文件插入到 `html` 文件中。可以配置，`link` 或 `<style>` 的形式引入。

三个 `loader` 的处理流程可以概括为：

```js
require("style!css!less!./file.less")
```
>注意：处理顺序跟书写的顺序是相反的。


而 [css-module](https://webpack.js.org/loaders/css-loader/#modules) 功能由 `css-loader` 提供。

---

### 解决方案

#### 修改文件后缀

修改文件名称是最常见的做法，显示的告知 `webpack`，哪些样式文件是需要启用 `css-module` 功能的。常见的配置如下：

```js
//...
{
test: /\.less$/,
use: [
  { loader: 'style-loader' },
  { loader: 'css-loader', options: { modules: true } },
  { loader: 'less-loader' }
]
},
{
test: /\.plainless/,
use: [
  { loader: 'style-loader' },
  { loader: 'css-loader' },
  { loader: 'less-loader' }
]
}
//...
```

#### 通过 `AST` 动态识别 `css-module` 文件

最近看到了 [umijs](https://github.com/umijs/umi)，提供的一个 [webpack-plugin](https://github.com/umijs/umi/blob/master/packages/babel-plugin-auto-css-modules/README.md) 很好的解决了这个问题，在无需修改文件后缀的前提下动态的识别 `css-module` 文件，添加相应的配置。其实现原理如下：

+ 通过 [AST](https://astexplorer.net/) 发现差异

在不需要 `css-module` 的情况下，项目中引入 样式文件的形式：

```js
import './style.less'
```

在需要使用 `css-module` 的情况下，项目中引入样式文件的形式：

```js
import styles from './style.less'
```

这两种写法在 `babel` 编译的时候，生成的 `AST` 是不同的：

*import './style.less'* 模式：

```json
//...
{
  "type": "ImportDeclaration",
  "start": 468,
  "end": 489,
  "specifiers": [],
  "source": {
    "type": "Literal",
    "start": 475,
    "end": 489,
    "value": "./style.less",
    "raw": "'./style.less'"
  }
},
//...
```

*import styles from './style.less'* 模式：

```json
//...
{
  "type": "ImportDeclaration",
  "start": 391,
  "end": 424,
  "specifiers": [
    {
      "type": "ImportDefaultSpecifier",
      "start": 398,
      "end": 404,
      "local": {
        "type": "Identifier",
        "start": 398,
        "end": 404,
        "name": "styles"
      }
    }
  ],
  "source": {
    "type": "Literal",
    "start": 410,
    "end": 424,
    "value": "./style.less",
    "raw": "'./style.less'"
  }
}
//...
```

因为写法不同 `css-module` 的形式会多处一个 `specifiers` 数组。所以我们可以从这里做文章。

`babel-autocss-module-plugin` 实现：

```js

const { extname } = require('path');

const CSS_FILE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'];

module.exports = () => {
  return {
    visitor: {
      ImportDeclaration(path) {
        const { specifiers, source } = path.node;
        const { value } = source;
        if (
          specifiers.length > 0
          && CSS_FILE_EXTENSIONS.includes(extname(value))
        ) {
          source.value = `${value}?modules`;
        }
      },
    },
  };
};

```
>关于 `babel-plugin` 的编写，可以参考 [babel-handle-book](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)。通过判断 `spefifiers` 数组的长度，结合文件后缀，给样式文件 url 加上 `css-module` 特定的参数。


具体 `webpack` 配置如下：

```js
//...
{
test: /\.less$/,
oneOf: [
  {
    resourceQuery: /modules/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { modules: true } },
      { loader: 'less-loader' }
    ]
  },
  {
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader' },
      { loader: 'less-loader' }
    ]
  }
]
}
//...
```

>利用 [resourceQuery](https://webpack.js.org/configuration/module/#ruleresourcequery) 的能力，查询是否存在特定的参数，来决定是否启用 `css-module` 的功能。达到了不用修改文件名的形式，兼容了普通 `css` 和 `css-module` 的样式文件，简单而优雅：）

---

### 总结

+ `less` 文件编译通常包含三个步骤：less-loader->css-loader-style-loader, 每个 `loader` 职责不同

+ 兼容 `css-module` 通常有修改文件后缀的做法，但是该做法不够优雅，所以从 `AST` 入手，动态识别样式文件引入方式，决定是否启用 `css-module` 功能

---

### 参考

[css-loader](https://github.com/webpack-contrib/css-loader)
[style-loader](https://github.com/webpack-contrib/style-loader)
[less-loader](https://github.com/webpack-contrib/less-loader)
[css-loader vs style-loader](https://stackoverflow.com/questions/34039826/webpack-style-loader-vs-css-loader)
[babel-plugin-auto-css-modules](https://github.com/umijs/umi/blob/master/packages/babel-plugin-auto-css-modules/README.md)
[babel-plugin-handbook.md](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md)
