---
title: typescript 类型判断
date: 2020-03-15 00:47:16
tags: typescript
categories: web
---

`javascript` 是一门弱类型的语言，代码的健壮性一直被诟病。为了安全起见，每次在对变量做一些操作的时候，首先需要判断一下变量的类型，常见的方式如：`in` 操作符合、`typeof` 、`instanceof` 等。`typescript` 在完全兼容 `js` 的基础上，提出了更友好的类型检查机制，同时提供了严格的类型检查编译器，对整个程序的安全性有了极大的提升，对后续代码重构等也有很大的裨益。

<!-- more -->

### 常见的类型保护机制

#### `in` 操作符

[in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in) 操作符作用原理:
>The in operator returns true if the specified property is in the specified object or its prototype chain.

先定义基本类型供测试用。
```ts
// type defined
interface IFoo {
    foo: number
}

interface IBar {
    bar: string
}
```

**基本用法**

```ts
// in operation
function testIn(arg: IFoo | IBar) {
    if ('foo' in arg) {
        console.log(arg.foo.toFixed(2))
    }
    // Property 'foo' does not exist on type 'IBar'
    console.log(arg.foo)
}
```
通过以上示例可以看到：
>1. 在 `if` 作用域里面，`arg` 变量类型被转换成，`IFoo`。所以我们可以执行：`toFixed` 这类 `foo` 属性上的操作。
>2. 在 `if` 作用域之外，直接使用 `foo` 这个属性是会报错的，因为这个时候 `arg` 的类型等于：`IFoo | IBar`。

**in 操作符的缺陷**
>1. `in` 操作符会遍历对象和原型链上的属性，包括属性配置 `enumerable` 等于 `false` 的属性。比如：`console.log('toString' in arg)` 打印出 `true`

**in 操作符的优势**
>1. 可以区分出，某个属性是被删除的，还是值等于 `undefined`

举个例子
```ts
const obj = { a: 1, b: undefined }
console.log('b' in obj) // true
console.log('c' in obj) // false
console.log(typeof obj.b) // undefined
console.log(typeof obj.c) // undefined
```

#### `typeof` 操作符

[`typeof`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof) 操作符的基本原理
> `typeof` 操作符返回固定的几种类型。通过这种机制来做类型的判定。

**基本用法**

写一个 `demo`：

```ts
// typeof operation
function testTypeof(arg: number | string) {
    if (typeof arg === 'string') {
        console.log(arg.toUpperCase())
    }
    // Property 'toUpperCase' does not exist on type 'number'
    arg.toUpperCase()
}
```
通过以上示例可以看出：
>1. `typeof` 同 `in` 操作符，在 `if` 作用域区块内，保持 `arg` 是 `string` 类型。
>2. `typeof` 同 `in` 操作符，在 `if` 之外的作用域类型等于，`number | string`

**typeof 的缺陷**

1. 只能做初略的判定，返回值固定 `8` 种类型，对于用户自定义类型的判定比较困难，比如对于属性值等于 undefined 和属性不存在的判定就是不合法的
2. 存在 `typeof null` 等于 `object` 的问题


#### `instanceof` 操作符合
[instanceof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/instanceof) 的基本原理
>`instanceof` 运算符用于检测构造函数的 prototype 属性是否出现在某个实例对象的原型链上。

**基本用法**
```ts
class XX {
  a: number
  b: string
}

const inst = new XX()

console.log(inst instanceof XX) // true
console.log(inst instanceof Object) // true
console.log(inst.__proto__ === XX.prototype) // true
console.log(XX.prototype.__proto__ === Object.prototype) // true
```
通过以上示例可以看出：
>`inst` 指向的原型是 `XX.prototype`，而 `XX.prototype` 的上一级原型是 `Object.prototype`，  `instanceof` 通过逐级查询原型链的方式来判定类型。

**instanceof 的缺陷**
> 1. 逐级查询的方式有些情况是优势，某种情况也可能会导致误操作，导致判定出来的类型不是想要的
> 2. `instanceof` 操作符的右操作数要求是一个 `Constructor`，这就导致在 `ts` 环境下，`interface` 和 `type` 定义的类型等不能放在该位置


#### 常量类型的判断

基本原理：
>通过 `typescript` 类型变量的值来做判定。

**基本用法**

```ts
// literal string type
type Foo = { k: 'foo', v: number }
type Bar = { k: 'bar', v: string }
function testLiteralString(arg: Foo | Bar) {
    if (arg.k === 'foo') {
        console.log(arg.v.toFixed(2))
    }
    // Property 'length' does not exist on type 'number'
    arg.v.length
}
```
通过以上示例可以看出：
>和其他类型类似，`常量类型的判断` 只会对 `if` 区块生效。

#### 用户自定义类型保护
`typescript` 内置了一个 `is` 操作符，专门用于类型的判定。
**基本用法**

```ts
// is operator
type Foo1 = { k: 'foo', hello: () => void }
type Bar1 = { k: 'bar', v: string }

function isFoo(arg: Foo1 | Bar1): arg is Foo1 {
  return arg.k === 'foo'
}

function testIs(arg: Foo1 | Bar1) {
    if (isFoo(arg)) {
        // ok
        arg.hello()
    }
    // Property 'hello' does not exist on type 'Bar1'
    arg.hello()
}
```
通过以上示例可以看出：
> 1. 同其他类型，只在 `if` 区块内生效
> 2. `isFoo` 函数的实现和 `typeof` 类似，但是返回值不是 `Boolean` 而是一个特殊的用法（arg is Foo1）

把 `isFoo` 函数返回值去掉试一下：

```ts
function isFoo(arg: Foo1 | Bar1) {
  return arg.k === 'foo'
}

function testIs(arg: Foo1 | Bar1) {
    if (isFoo(arg)) {
        //  Property 'hello' does not exist on type 'Bar1'
        arg.hello()
    }
    // Property 'hello' does not exist on type 'Bar1'
    arg.hello()
}
```
`isFoo` 的返回换成 `Boolean` 之后，`if` 区块内 `arg` 变量的类型并没有变成 `Foo1` 。这正是 `is` 操作符的威力所在。

---
### 其他建议

#### 开启 `strictNullChecks`

在未开启 `strictNullChecks` 的情况下，`typescript` 里面可以给任意类型的变量赋值：`null` 或者 `undefined`。这通常是有好处的，因为我们的程序代码里面经常不需要区分 `null` 和 `undefined` 的情况。可以简单的使用：`x != null` 来判定这两种类型。 关于 `null` 有一个著名的 [百万美金错误](https://en.wikipedia.org/wiki/Null_pointer#History) 故事，如果你不想重蹈覆辙，所以还是尽可能启用这个特性吧！：）

在开启 `strictNullChecks` 的情况下，程序代码会发生一些变化：

```ts
let x = 123

x = null // Type 'null' is not assignable to type 'number'
x = undefined // Type 'undefined' is not assignable to type 'number'
```
可以看到在这个时候 `undefined` 和 `null` 不能随意赋值给其他类型的变量。

再看一个例子：
```ts
function testStrictNull(arg?: number) {
    //...
}

// ok
testStrictNull(123)
// Argument of type 'null' is not assignable to parameter of type 'number | undefined'
testStrictNull(null)
// ok
testStrictNull(undefined)
```
通过上面的例子可以发现，可选参数的类型其实隐含了 `| undefined` 的行为。所以传入 `null` 被认为是非法的，而 `undefined` 是没问题的。


#### 使用 `unknow` 类型来替代 `any`

`any` 类型常常用于处理刚把 `javascript` 代码迁移到 `typescript`，一时半会没有稳定的类型可用。或是对于第三方库，我们不知道它的类型，所以我们只能通过 `any` 类型来标注它。换句话说，**不是万不得已**一般不建议使用这个类型，因为它会逃过 `typescript` 的类型检查。使得代码错误风险提升。

举个例子：

```ts
function testAny(arg: any) {
    // ok
    arg.toUpperCase()
}

testAny(123)
```

对于 `number` 类型，在 `testAny` 内调用该类型上不存在的方法也不会报错。

`unknow` 被称之为类型安全版本的 `any` 在绝大多数情况下，都可以使用 `unknow` 来替换 `any`。

在对 `unknow` 类型的变量做操作的时候，需要判定具体的类型：

```ts
function testUnknow(arg: unknown) {
    arg.toUpperCase() // Object is of type 'unknown'.
}

testUnknow(123)
```


---
### 总结

+ `typescript` 继承了 `javascript` 的三种类型判定方法，但这三种方式有一定的缺陷。同时 `typescript` 还提供了通过类型的判定机制，以及结合 `is` 关键字判定的方式。通常情况下，建议使用 `typescript` 提供的方式，这样对类型更加友好一些。

+ 为了提高程序的健壮性，建议开启 `strictNullChecker`，同时尽量避免使用 `any` 来标注类型。如果确实有需要使用 `any` 的情形，也建议使用 `unknown` 类型来替换。

---
### 参考

[advanced types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)

[basarat type guard](https://basarat.gitbook.io/typescript/type-system/typeguard)

[New unknown top type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html)
