---
title: create-react-app支持ts和decorator
date: 2019-02-01 16:59:35
tags: react
categories: web
---

create-react-app默认使用`js`作为开发语言，`ts`拥有强大的类型系统，更加适用于大型项目开发。许多面向对象的语言都有装饰器的语法，目前js也有相关的提案[decorators](https://github.com/tc39/proposal-decorators)。

#### 创建新的应用：

1. 直接创建`ts`项目

```shell
npx create-react-app my-app --typescript

# or

yarn create react-app my-app --typescript

```

2. 把老的`js`项目迁移到`ts`

```shell

npm install --save typescript @types/node @types/react @types/react-dom @types/jest

# or

yarn add typescript @types/node @types/react @types/react-dom @types/jest

```

#### 修改jsx文件名后缀，改为tsx

```shell

App.jsx -> App.tsx
index.jsx -> index.tsx

```

#### `ts`开启装饰器支持

修改`tsconfig.json`文件，加入配置：

```shell

"experimentalDecorators": true

```


#### 其他

##### js项目开启装饰器

+ 把配置文件暴露出来

```shell

yarn run eject

```

+ 安装装饰器模块

```shell

yarn add babel-plugin-transform-decorators-legacy

```

+ 修改配置文件

开发环境和生产环境的配置文件都在` /config/webpack.config.js`下面。修改相应的配置项目：

```shell

// Process JS with Babel.
 {
   test: /\.(js|jsx)$/,
   include: paths.appSrc,
   loader: require.resolve(‘babel-loader’),
   options: {
     plugins: [‘transform-decorators-legacy’],
     ...

```


参考资料：

[adding-typescript](https://facebook.github.io/create-react-app/docs/adding-typescript)  
[decorator-support-to-your-create-react-app](https://medium.com/@rodcisal/ejecting-and-adding-decorator-support-to-your-create-react-app-a4a7d80e4077)