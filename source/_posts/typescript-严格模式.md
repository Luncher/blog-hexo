---
title: typescript 严格模式
date: 2020-04-06 21:10:43
tags: [strict-mode,tsconfig]
categories: [web,typescript]
---
### 背景

`ts` 编译器包含严格模式（`strict mode`）一系列配置。通过这些配置，能限制一些不良的编码习惯，以及可能由于思维漏洞而导致的 `BUG`，把问题在编译/编码阶段就暴露出来而不是等到上线之后由客户来反馈 :)。
强烈建议尽可能的开启部分或者全部的严格模式，这对代码质量大有裨益。本文尝试分析 `ts` 的严格模式配置，并提出 `fix` 相关代码的建议。

<!-- more -->

---

### 配置

#### strict

[strict](https://www.typescriptlang.org/tsconfig#strict) 
>等于其它选项的总开关，开启该项等于开启所有的严格模式配置。

---

#### noImplicitAny

[noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny)
>`ts` 对于没有类型标注的变量隐含推断出变量类型为: `any`。`noImplicitAny` 针对此类变量的定义报错。


看个例子：

```ts
// Parameter 'a' implicitly has an 'any' type
function hello(a) {
  console.log(a)
}
```

---

#### strictNullChecks

[strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)
>有的时候，我们的代码没有区分 `null` 和 `undefined`。但是这样可能在运行时导致一些非预期的行为。毕竟在 `javascript` 的环境下，`null` 和 `undefined` 是两种类型。开启 `strictNullChecks`, `ts` 对于 `null` 和 `undefined` 作为两个类型来看待。

+ `strictNullChecks` 等于 `false`

```ts
let i = 123
// ok
i = undefined
// ok
i = null
```

+ `strictNullChecks` 等于 `true`

```ts
let i = 123
// Type 'undefined' is not assignable to type 'number'
i = undefined
// Type 'null' is not assignable to type 'number'
i = null
```

+ `strictNullChecks` 等于 `true` 下的可选属性

```ts
class A {
  prop?: number
}
const inst = new A()
// ok
inst.prop = undefined
// ok
inst.prop = 123
```
>`prop?: number` 等于 `prop: number | undefined`

+ xx is possibly 'undefined'

```ts
const arr = [1, 2, 3]

// const target: number | undefined
const target = arr.find(it => it === 3)
//Object is possibly 'undefined'
target.toFixed(2)
```
>严格模式下，对于可能返回为空的返回值，使用前需要再次判断一次，否则 `ts` 会报错提示。这个时候 `non-null assertion` 或许是一个经济的做法，另外可以参考另一篇博文：[typescript-类型判断](https://luncher.github.io/2020/03/15/typescript-%E7%B1%BB%E5%9E%8B%E5%88%A4%E6%96%AD/)

---

#### strictFunctionTypes

[strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes)
>当开启的时候，`ts` 会严格比较函数的类型，指的是参数类型，不包含返回值类型。(因为一些历史原因，该模式只针对函数变量的语法，而不针对成员函数的语法，具体参考：[strictFunctionTypes](https://www.typescriptlang.org/tsconfig#strictFunctionTypes))

看一个例子：

+ `strictFunctionTypes` 等于 `false`

```ts
type callFunc = (arg: number | string) => boolean | object

function testFunc1(arg: number): boolean {
  return arg > 3
}
// ok
let test1: callFunc = testFunc1
```

+ `strictFunctionTypes` 等于 `true`

```ts
type callFunc = (arg: number | string) => boolean | object

function testFunc1(arg: number): boolean {
  return arg > 3
}

// Type 'string | number' is not assignable to type 'number'
let test1: callFunc = testFunc1
```

+ `strictFunctionTypes` 等于 `true` 且 函数类型比函数类型变量具体

```ts
type callFunc = (arg: number) => boolean | object

function testFunc1(arg: number | string): boolean {
  return arg > 3
}

// ok
let test1: callFunc = testFunc1
```
>函数参数类型：`number | string`。函数类型变量参数：`number`.

---

#### strictBindCallApply

[strictBindCallApply](https://www.typescriptlang.org/tsconfig#strictBindCallApply)
>顾名思义，这个配置项主要针对的就是 `javascript` 内置的三个方法：`call`、`apply`、`bind`。

+ strictBindCallApply 等于 `false`

```ts
function test(a: number) {
  //...
}

// ok
test.apply(null, [false])
```
>函数预期的是 `number` 类型，传一个 `boolean` 绕过了检查

+ strictBindCallApply 等于 `true`

```ts
function test(a: number) {
  //...
}

// Type 'false' is not assignable to type 'number'
test.apply(null, [false])
```

+ strictBindCallApply 等于 `true`, 目标参数类型放宽

```ts
function test(a: number | boolean) {
  //...
}
// ok
test.apply(null, [false])
```

---

#### strictPropertyInitialization

[strictPropertyInitialization](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization)
>主要针对成员变量的初始化问题，对于非可选的成员变量没有初始化则报错。

看一个例子：

```ts
class A {
  // Property 'prop' has no initializer and is not definitely assigned in the constructor
  prop: string
}

class B {
  // ok
  prop: string
  constructor() {
    this.prop = "hello"
  }
}

class C {
  // ok, 等于 prop: string | undefined
  prop!: string
}
```
> 使用的时候需要判断变量是否等于 `undefined`。 这个时候 `non-null assertion` 或许是一个经济的做法，另外可以参考另一篇博文：[typescript-类型判断](https://luncher.github.io/2020/03/15/typescript-%E7%B1%BB%E5%9E%8B%E5%88%A4%E6%96%AD/)

---

#### noImplicitThis

[noImplicitThis](https://www.typescriptlang.org/tsconfig#noImplicitThis)
>同 `noImplicitAny`，不过针对的是 `this`。如果 `this` 被推断成 `any` 类型则报错。

看个例子：

```ts
class Base {
  width = 3
  height = 4

  getArea() {
    return function () {
      // 'this' implicitly has type 'any' because it does not have a type annotation
      return this.width * this.height
    }
  }
}
```

修复：

```ts
class Base {
  width = 3
  height = 4

  getArea() {
    return () => {
      // ok
      return this.width * this.height
    }
  }
}
```
>把普通函数转换成箭头函数的写法，`ts` 能正确推断出 `this` 的类型。

---

#### alwaysStrict
[alwaysStrict](https://www.typescriptlang.org/tsconfig#alwaysStrict)
>开启该模式之后，编译输出的 `js` 文件开启 `strict mode` 模式。具体参考 [js-strict-mode](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Strict_mode)

看个例子：

+ alwaysStrict 等于 `false`
```ts
// xx.ts
console.log('hello world')

// xx.js
console.log('hello world');
```

+ alwaysStrict 等于 `true`
```ts
// yy.ts
console.log('hello world')

// yy.js
"use strict";
console.log('hello world');
```

---

### 总结

+ 详细分析了 `ts` 严格模式的各项配置以及适用的场景：
    + `noImplicitAny` 适用于推断 `any` 类型的变量错误
    + `noImplicitThis`推断 `any` 类型的 `this` 错误
    + `strictNullChecks` 用于区分 `undefined` 和 `null` 以及其它变量类型
    + `strictFunctionTypes` 针对的是函数类型变量参数问题
    + `strictBindCallApply` 关注 `bind`、`call`、`apply` 三个方法调用的参数问题
    + `strictPropertyInitialization` 关注类成员变量的初始化问题
    + `alwaysStrict` 控制编译输出的 `js` 文件是否要开启严格模式
+ 如果不能启用全部的配置项（通过 `strict`），那么也应该尽可能多的开启配置项。


---


### 参考

[Strict_Type_Checking_Options_6173](https://www.typescriptlang.org/tsconfig#Strict_Type_Checking_Options_6173)

[typescript-类型判断](https://luncher.github.io/2020/03/15/typescript-%E7%B1%BB%E5%9E%8B%E5%88%A4%E6%96%AD/)
