---
title: tsconfig 必知必会
date: 2020-06-30 22:49:55
tags:
categories: [typescript]
---

### 背景

`tsconfig.json` 是 `ts` 项目的配置文件，用于项目的编译。归纳总结，主要包含了几块内容：

+ 项目的安装和初始化
+ 编译输入文件
+ 编译输出配置
+ 基本编译选项
+ 对 `js` 的支持
+ 类型检查和 `lint` 配置
+ 模块解析配置
+ 其他配置

本文尝试分析日常开发过程中必须熟悉的 `tsconfig` 相关配置知识。

<!-- mode -->

---

### 安装编译工具

`tsc` 作为 `ts` 项目文件的编译器，需要先安装好。

> npm i -g typescript


如果希望安装到现有的某个项目下，可以使用：

>npm install typescript --save-dev


安装完毕之后会有一个 `tsc` 的命令。

---

### 初始化配置

`tsc` 有个 `init` 的指令，执行命令：
```shell
tsc --init
```

在当前目录下生成一个 `tsconfig.json`, 如：

```json

{
  "compilerOptions": {
    /* Basic Options */
    "target": "es5",                          /* Specify ECMAScript target version: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020', or 'ESNEXT'. */
    "module": "commonjs",                     /* Specify module code generation: 'none', 'commonjs', 'amd', 'system', 'umd', 'es2015', 'es2020', or 'ESNext'. */
    "strict": true,                           /* Enable all strict type-checking options. */
    "esModuleInterop": true,                  /* Enables emit interoperability between CommonJS and ES Modules via creation of namespace objects for all imports. Implies 'allowSyntheticDefaultImports'. */
    "forceConsistentCasingInFileNames": true  /* Disallow inconsistently-cased references to the same file. */
    //... 其他配置
  }
}

```

默认生成的配置文件只包含了编译相关的配置， 因为对于输入文件和输出都有默认的行为。

---

### 输入文件

>`tsconfig` 默认如果不配置输入文件，则会加载当前项目下所有的以：`.ts `、`.tsx` 、`.d.ts` 结尾的文件。如果配置了 `allowJs` 还会加载 `.js`、`.jsx` 文件。

`tsconfig` 内跟输入文件有关的主要包含三个配置：`files`、`include`、`exclude`。`files` 和 `include` 用于指定输入文件，`exclude` 用于指定需要排除的输入文件。需要注意的是，如果 `exclude` 内指定的文件，在实际的编译过程中还是被引用 (`import`) 了，那么该文件还是会参与编译。


`files` 和 `include` 作用并不重复，其主要区别在于：

+ `includes` 能使用 `glob` 通配符，而 `files` 只能包含**某个文件**的相对路径
+ `files` 指定的文件不能被 `exclude` 排除，而 `include` 则可以


来看一个 `Demo`：

当前目录结构如下：

```shell
.
├── package.json
├── src
│   ├── dir
│   │   ├── foo.js
│   │   └── foo.ts
│   ├── dir2
│   │   └── bar.ts
│   └── index.ts
└── tsconfig.json
```

`tsconfig.json` 配置：

```json
{
  "include": [
    "src/**/*.*"
  ],
  "exclude": [
    "src/dir/*.*"
  ],
  //... 其他配置
}
```

编译文件：
>tsc --outDir ./dist

生成文件：

```shell
➜  dist tree .
.
├── dir2
│   └── bar.js
└── index.js
```

**因为 dir 内的文件被排除了，所以没有参与编译**

修改配置，强制包含 `dir` 内的文件：

```json
{
  "files": ["src/dir/foo.ts"],
  //...其他配置
}
```

生成结果：

```shell
➜  dist tree .
.
├── dir
│   └── foo.js
├── dir2
│   └── bar.js
└── index.js
```

---

### 输出文件

输出的文件配置主要包含两个选项：`outFile`、`outDir`。

`outFile` 用于指定输出的文件，该指令会把输入文件合并成单个文件，文件顺序取决余代码加载的顺序。`outDir` 不会合并文件，会把文件按照原位置输出。需要注意的是 `outFile` 对于 `module` 有要求，当开启 `outFile` 的时候，`module` 指定的模块规范必须支持单文件的模式。只有 "AMD" 和 "System"能和 `outFile` 一起使用。

看个 `demo`:

`tsconfig`: 

```json
{
"compilerOptions": {
  "module": "amd",
  "outFile": "./aa.js"
},
//...其他配置
}
```

编译输出：

```js
"use strict";
define("dir/foo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.foo = 123;
});
define("dir2/bar", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bar = 456;
});
```

可以看的多个源文件被合并成单个文件输出。

---


### 基本编译配置


+ incremental

`incremental` 表示增量的意思，作用在于减少编译的时间，每次编译会保存编译信息，下次编译的时候加载本次编译信息，只做增量的编译，从而减少编译时间。还有一个配置项叫：`tsBuildInfoFile` 用于指定保存编译信息的文件路径。


+ target

指定编译输出文件的 `ECMAScript` 版本信息，可能的值有：`ES3`、`ES5` 、`ESNEXT` 等。
>`ESNEXT` 是一个动态的概念，表示截止目前为止最新的标准 `ECMAScript` 特性，外加进入 `stag-3` 及以上阶段的特性。


+ module

`module` 指定输出代码的模块格式，支持的模块有：

1 commonjs
2 es module
3 amd
4 umd
5 systemjs
6 none

关于模块的详细说明，参考 [modules](https://www.typescriptlang.org/docs/handbook/modules.html)。

+ lib

`lib` 给 `ts` 编译的时候提供默认的类型信息，主要指的是内置的语言 `API`信息。如果 `lib` 选项没有配置，默认的行为：
1. 当 `target` 等于 `es5` 的时候，`lib` 等于 [DOM,ES5,ScriptHost]
2. 当 `target` 等于 `es6` 的时候，`lib` 等于
[DOM,ES6,DOM.Iterable,ScriptHost]

当我们的项目中需要使用某些语言特性，但是不在默认的 `lib` 列表内，那么就需要手动指定。需要注意的是 `tsc` 不会帮我们做 `polyfill` 的事情，这是[有意为之](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals#non-goals)。即：指定 `lib` 只能绕过类型检查，但是 `polyfill` 的事情需要开发者自己完成。

>Provide additional runtime functionality or libraries. Instead, use TypeScript to describe existing libraries

简而言之，`tsc` 提供了某种 `syntax transform
`(语法转换)的能力，如转译箭头函数的功能，但是不做 `polyfill` 的事情。这个需要开发者自行完成。

看个 `demo`:

`index.ts`
```typescript

// 类型“(number | number[])[]”上不存在属性“flat”
const arr = [1,2,3, [4]].flat() 
```

把 `ES2019` 加上：

```json
{
  //...
  "compilerOptions": {
    "lib": ["DOM", "ES2015", "ES2019"],
  }
  //...
}
```

警告就消失了。

关于 `polyfill` 和 `transplier` 的差异请参考：[babel-研究-polyfill-vs-transpiler](https://luncher.github.io/2020/03/22/babel-%E7%A0%94%E7%A9%B6-polyfill-vs-transpiler/)，以及：[what-is-the-difference-between-polyfill-and-transpiler](https://stackoverflow.com/questions/31205640/what-is-the-difference-between-polyfill-and-transpiler)。

---

### 对 js 的支持

+ allowJs

默认的 `tsc` 编译只会加载 `ts` 和 `tsx` 文件，如果还需要编译 `js
` 、或 `jsx`，则需要把该选项打开。

+ checkJs

`checkJs` 跟 `allowJs` 配合使用，默认 `tsc` 不对参与编译的 `js` 文件做类型检查，可以通过该配置项目，启用检查。

---

### 类型检查和 `lint`

#### lint 检查配置

+ noUnusedLocals
>针对未使用的局部变量 lint 告警

+ noUnusedParameters
>针对未使用的函数参数 lint 告警

+ noImplicitReturns
>针对需要返回值但是没有返回的函数 lint 告警

+ noFallthroughCasesInSwitch
>针对没有 `default case` 的 `switch` 告警

`tsc` 也支持部分 `lint` 检查能力，几个配置项目都比较直观。


#### 类型检查配置

`ts` 提供了完整的类型检查机制，参考：[typescript-严格模式](https://luncher.github.io/2020/04/06/typescript-%E4%B8%A5%E6%A0%BC%E6%A8%A1%E5%BC%8F/)。

---

### 模块解析配置

#### 相对路径加载 vs 非相对路径加载

相对路径加载定义，指的是以以下几个字符开始的加载目录：

1、`/`
2、`./`
3、`../`

所有其他类型的 `import` 路径都被认为是非相对路径的加载例如：

`import jquery from 'jquery'`

所有通过相对路径加载的模块，用户必须保证所在模块必须存在，不会走 `baseUrl`、`path mapping`、以及环境模块声明(`ambient module declaration`)。

#### 模块解析策略

`moduleResolution` 配置项目用于指定模块的加载策略，`typescript` 模块解析分为两种策略：

1、classic
2、node

如果用户没有配置 `moduleResolution`，默认当 `module` 等于：`AMD` | `System` | `ES2015` 的时候，使用 `classic` 策略，其他 `module` 使用 `node` 策略。

**classic** 策略：

1、相对模块

假设当前文件：`/root/src/folder/A.ts` 有模块加载语句：

`import { b } from "./moduleB"`

那么 `tsc` 将会查找如下文件：

a、`/root/src/folder/moduleB.ts`
b、`/root/src/folder/moduleB.d.ts`


2、非相对模块

假设当前文件：`/root/src/folder/A.ts` 有模块加载语句：

`import { b } from "moduleB"`

那么 `tsc` 将会按照如下顺序查找模块：

a、`/root/src/folder/moduleB.ts`
b、`/root/src/folder/moduleB.d.ts`
c、`/root/src/moduleB.ts`
d、`/root/src/moduleB.d.ts`
e、`/root/moduleB.ts`
f、`/root/moduleB.d.ts`
g、`/moduleB.ts`
h、`/moduleB.d.ts`

**node** 策略

这里简要说说 `node.js` 如何做模块加载的，标准的 `node.js` 模块加载使用 `require` 函数加载模块。

假设有 `/root/src/moduleA.js` 文件包含一个 `require` 语句：

`var x = require("./moduleB");`

`node.js` 将会按照以下顺序查找模块：

a、查找 `/root/src/moduleB.js`
b、如果 `/root/src/moduleB` 是一个文件夹，文件夹包含 `package.json` ，`package.json` 下有个 `main` 字段指定了具体了文件
c、如果 `/root/src/moduleB` 是一个文件夹，文件夹包含一个 `index.js` 文件，该文件被认为是这个文件夹的导出模块

假设有 `/root/src/moduleA.js` 文件包含一个 `require` 语句：
`var x = require("moduleB");`

`node.js` 将会按照以下顺序查找模块：

a、`/root/src/node_modules/moduleB.js`
b、`/root/src/node_modules/moduleB/package.json (如果指定了 `main` 字段)`
c、`/root/src/node_modules/moduleB/index.js`
d、`/root/node_modules/moduleB.js`
e、`/root/node_modules/moduleB/package.json (如果指定了 `main` 字段)`
f、`/root/node_modules/moduleB/index.js`

g、`/node_modules/moduleB.js`
h、`/node_modules/moduleB/package.json (如果指定了 `main` 字段)`
i、`/node_modules/moduleB/index.js`

完整的过程请参考：[modules_loading_from_node_modules_folders](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders)。

**typescript** 版本的 `node` 加载策略

该模式和 `node.js` 版本非常相识，不同在于：

1、默认加载: `.ts`、`.tsx`、`.d.ts` 文件（如果配置了 `allowJs`会加载: `.js`、`.jsx`、`.d.js`）
3、查找 `package.json` 的 `types` 字段，而不是 `main` 字段

假设有 `/root/src/moduleA.js` 文件包含一个 `import` 语句：

`import { b } from "./moduleB"`

`tsc` 将会按照如下顺序查找模块：

a、`/root/src/moduleB.ts`
b、`/root/src/moduleB.tsx`
c、`/root/src/moduleB.d.ts`
d、`/root/src/moduleB/package.json (if it specifies a "types" property)`
e、`/root/src/moduleB/index.ts`
f、`/root/src/moduleB/index.tsx`
g、`/root/src/moduleB/index.d.ts`

同样的假设有 `/root/moduleA.js` 文件包含一个 `import` 语句：

`import { b } from "moduleB"`

`tsc` 将会按照如下顺序查找模块：

1、`/root/node_modules/moduleB.ts`
2、`/root/node_modules/moduleB.tsx`
3、`/root/node_modules/moduleB.d.ts`
4、`/root/node_modules/moduleB/package.json (如果指定了 `types` 属性)`
5、`/root/node_modules/@types/moduleB.d.ts`
6、`/root/node_modules/moduleB/index.ts`
7、`/root/node_modules/moduleB/index.tsx`
8、`/root/node_modules/moduleB/index.d.ts`

9、`/node_modules/moduleB.ts`
10、`/node_modules/moduleB.tsx`
11、`/node_modules/moduleB.d.ts`
12、`/node_modules/moduleB/package.json (如果指定了 `types` 属性)`
13、`/node_modules/@types/moduleB.d.ts`
14、`/node_modules/moduleB/index.ts`
15、`/node_modules/moduleB/index.tsx`
16、`/node_modules/moduleB/index.d.ts`

**其他模块解析配置**

+ baseUrl

`baseUrl` 用于告诉编译器去哪里查找模块。当设置 `baseUrl` 的时候，所有非相对路径模块的模块导入，都被认为相对于 `baseUrl` 设置的路径。`baseUrl` 对相对路径的导入没有影响。

+ Path mapping
`Path mapping` 相对应模块导入的快捷方式，举个例子，假设我们希望 `import jquery from 'jquery'` 实际导入的是：`node_modules/jquery/dist/jquery.slim.min.js`，可以这么设置：

```json
{
  "compilerOptions": {
    "baseUrl": ".", // 当需要使用 `paths` 时必须设置
    "paths": {
      "jquery": ["node_modules/jquery/dist/jquery"] // 路径相对于 `baseUrl`
    }
  }
}
```

+ Virtual Directories(`rootDirs`)

`rootDirs` 用于把多个不同文件夹内的模块 `import` 可以像在查找同一个文件夹的模块。编译输出的时候，多个文件夹内的模块，会被合并成单个文件夹。


+ traceResolution

上面看到了模块解析有时候比较繁琐 `traceResolution` 是一个方便诊断模块加载问题的语法。它会列出 `tsc` 执行的时候，模块加载的顺序。


+ allowSyntheticDefaultImports

当我们加载某个没有 `default export` 的第三方包的时候，通常的写法如下：

```ts
import * as React from 'react'
```

开启了 `allowSyntheticDefaultImports` 的时候，写法可以变成：

```ts
import React from 'react'
```

需要注意的是，`allowSyntheticDefaultImports` 只会绕过类型检查，并不会对 `tsc` 编译出来的 `js` 代码产生影响。这个时候，需要的是 `esModuleInterop` 配置项目


+ esModuleInterop

`typescript` 采用标准的 `es modules` 标准。但是大量的第三方包采用的是 `common.js` 的模块规范。 `esModuleInterop` 配置项为 `es module` 模块导入 `commonjs` 模块提供便利。

通常 `node.js` 模块的导出方式为：

```js
module.exports = {
    foo: bar
}
```

没有 `export default`，所以我们在使用这类包的时候，只能写成：

```ts
import * as React from 'react'
```

开启 `esModuleInterop` 配置项目之后，可以写成：

```ts
import React from 'react'
console.log(React.Children)
```

`tsc` 会把上述代码编译成：

```js
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
console.log(react_1.default.Children);
```

注意：开启 `esModuleInterop` 后，自动会开启 `allowSyntheticDefaultImports` 配置项。


+ typeRoots

`typeRoots` 配置项主要用于，指定编译的时候，类型主要包含哪些类型什么的文件夹。默认配置为：
```shell
./node_modules/@types/,
../node_modules/@types/,
../../node_modules/@types/
```

当项目中有自定义类型文件夹的时候，可以通过该配置项来指定。如：

```json
{
  "compilerOptions": {
    "typeRoots": ["./typings", "node_modules/@types"]
  }
}
```

+ types

跟 `typeRoots` 不同的是，`types` 指定的是具体的某几个包的类型数组，而 `typeRoots` 指定某个文件夹，文件下的所有模块都会被包含。


### 其他配置

+ importHelpers

`tsconfig` 在开启某些配置项的时候，`tsc` 在编译输出文件内会插入而外的 `helper` 代码，如：

a、`extending class` 
b、`spreading arrays or objects`(展开语法)
c、`async` 操作

为了避免在每个输出的代码文件都有同样的一份 `helper` 代码，`ts` 提供了一个 [tslib](https://www.npmjs.com/package/tslib) 包，包含了所有 `helper` 代码的实现。


+ Source Map 配置

`declaration` 为编译输出的每个文件都提供一个类型声明文件，描述该文件导出的模块信息。

`declarationMap` 为每个类型声明文件，都额外生成一份 `source map` 文件。



### 参考

+ [tsconfig reference](https://www.typescriptlang.org/v2/en/tsconfig)
+ [modules](https://www.typescriptlang.org/docs/handbook/modules.html)
+ [module-resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
+ [node.js-modules](https://nodejs.org/api/modules.html)
