---
title: 基于 antd 的主题定制
date: 2020-03-07 20:40:33
tags: [antd,webpack,less]
categories: web
---

## 背景

最近接到一个需求，需求方要求 `UI` 主题风格做一些定制。当前前端团队基础设施如下：


![qiniu-web-framework.png](/images/antd-customize-theme/qiniu-web-framework.png)


团队组件库底层基于 `Antd` 封装，针对样式以及组件能力提供了一定的定制。这部分的组件库跟具体的业务无关，也就是说，它会提供类似 `Input` 这种控件、但是不会提供 `Singin` 这类控件。这类组件是 `基础设施` 的职责(如果需要的话)。所以要支持主题功能，意味着要同时对底层组件库以及基础设施做定制。

<!-- more -->

---

## 方案


### 约定可配置项

支持主题功能，并不意味所有的样式皆可配置（那样就乱套了..）。首先研究了一下 `Antd` 官方的配置项：

```less
@primary-color: #1890ff; // primary color for all components
@link-color: #1890ff; // link color
@success-color: #52c41a; // success state color
@warning-color: #faad14; // warning state color
@error-color: #f5222d; // error state color
@font-size-base: 14px; // major text font size
@heading-color: rgba(0, 0, 0, 0.85); // heading text color
@text-color: rgba(0, 0, 0, 0.65); // major text color
@text-color-secondary: rgba(0, 0, 0, 0.45); // secondary text color
@disabled-color: rgba(0, 0, 0, 0.25); // disable state color
@border-radius-base: 4px; // major border radius
@border-color-base: #d9d9d9; // major border color
@box-shadow-base: 0 2px 8px rgba(0, 0, 0, 0.15); // major shadow for layers
```

完整配置列表可以看：[default-theme](https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less)。


>由于项目初期，底层组件库和基础设施没有考虑主题的概念。意味着库中，部分样式的组织方式、变量定义是不合规的, 难以满足定制需求。关于这部分，完全可以参考 `antd` 的主题可配置变量来实现，这部分不展开讲了...

---

### 配置方案

研究了一圈关于主题定制的方案，包括 `Antd` 官方的方案。基本还是围绕样式变量替换这个主题，只是替换的方式不太一样。总结了一下，主要的方式如下：

#### 通过 `import` `override` 

**缺点：**

1. 修改面比较广，项目中所有使用到样式变量的地方都要替换
2. 底层组件库部分样式固定/变量没有导出，难以完成替换
3. 基础设施部分组件代码和样式没有分离，难以完成替换

>缺点分析：
>`override` 的方式缺陷主要跟 `webpack` 对样式文件的处理有关系, 主要包含以下一个步骤：
>1. `less-loader` 把 `less` 转换成 `css`
>2. `css-loader` 把每个被转换的 `css` 文件转换成 `webpack`  `module`，即：每个样式文件一个 `module`。
>3. `style-loader` 在运行时把样式代码插入 `html` 的 `head` 标签下，顺序依赖于样式文件被 `import` 的顺序。
>
> 通过上述分析发现：样式文件并不能通过全局替换一次的方式来达成，几乎项目代码中每个组件的样式文件都要 `import` 一次 `override` 样式文件。


**优势：**
暂时想不到：）

---

#### 利用 `less-loader` 的 `modifyVars` 能力

**缺点：**

1. `modifyVars` 只能修改 `global` `namespace` 内的变量，而基础设施和组件库内部分配置变量没有放到 `global` `namespace`中

>缺点分析：`less` 的 `modifyVars` 功能的作用类似于在 `less` 文件底部声明一个变量用于覆盖之前声明的变量，达到替换的效果。举个例子：

```less
.component {
    @color: #333;
    color: @color;
}
```

对于这种方式实现的样式实际上 `modifyVars` 是无能为力的，因为 `modifyVars` 做的事情类似于：

```less
.component {
    // 无法被替换
    @color: #333;
    color: @color;
}

@color: #666;
```

**优势：**
1. 对项目代码没有侵入性，只需要改 `less-loader` 的配置即可
2. 对基础设施以及组件库的要求比较低，只需要把部分固定的或者是没有导出的配置导出即可


---

## 主题配置

参考代码：

```js

// webpack.config.js
module.exports = {
  rules: [{
    test: /\.less$/,
    use: [{
      loader: 'style-loader',
    }, {
      loader: 'css-loader', // translates CSS into CommonJS
    }, {
      loader: 'less-loader', // compiles Less to CSS
      options: {
       modifyVars: {
         'primary-color': '#1DA57A',
         'link-color': '#1DA57A',
         'border-radius-base': '2px',
         // or
         'hack': `true; @import "your-less-file-path.less";`, // Override with less file
       },
       javascriptEnabled: true,
     },
    }],
    // ...other rules
  }],
  // ...other config
}

```

---

## 参考

+ [antd 主题配置](https://3x.ant.design/docs/react/customize-theme#header)
+ [less-loader](https://webpack.js.org/loaders/less-loader/)
+ [webpack-loader-order](https://stackoverflow.com/questions/32234329/what-is-the-loader-order-for-webpack)
+ [css-loader vs style-loader](https://stackoverflow.com/questions/34039826/webpack-style-loader-vs-css-loader)
