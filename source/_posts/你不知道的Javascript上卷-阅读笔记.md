---
title: 你不知道的Javascript上卷-阅读笔记
date: 2016-10-08 14:46:41
tags: javascript
categories: web
---


# SCOPE&CLOSURES--THIS&OBJECT-PROTOTYPES

---

## 作用域和闭包

### 作用域是什么？

#### *作用域的定义：*

>需要一套良好的规则存储变量，并且之后可以找到这些变量，这套规则被称为作用域。

编译原理基本步骤：

- 词法分析，把代码块分解为词法单元
- 语法分析，把词法单元转换为抽象语法树AST
- 代码生成，将AST转换为可执行的代码(机器指令)

对比传统的编译型语言，javascript编译发生在代码执行前的几微妙。javascript引擎用`JIT`来保证性能最佳。

在代码生成的过程中，需要`引擎`、`编译器`、`作用域`三者协作完成。在编译的过程中，引擎会进行`LHS`,`RHS`操作。`RHS`表示取得变量的值，而`LHS`表示获取赋值操作的目标。

#### *作用域嵌套：*

> 引擎从当前执行作用域开始查找变量，如果找不到就会向上一级继续寻找，直到到达最外层作用域。

作用域操作的异常：

> `RHS`操作失败会抛出`ReferenceError`异常，而`LHS`操作没有找到目标变量，如果非严格模式下会创建一个全局变量，严格模式下会抛出`ReferenceError`。如果对`RHS`操作的变量的值进行不合理操作会抛出`TypeError`。

---

### 词法作用域

词法作用域由书写代码时决定，通过一些方法如`eval`、`with`。可以在词法分析器处理之后修改作用域。

在标示符查找的过程中同名的会发生屏蔽，全局变量会自动成为全局对象的属性，因此可以通过`window.a`的形式访问被屏蔽的全局变量。

---

#### 欺骗词法

- eval

把字符串参数当做代码运行，就好像代码原来就是在那个位置。通过这种方式来修改词法作用域。严格模式下`eval`在运行时有自己的词法作用域，意味着其中的声明无法修改所在的作用域。


- with

把一个对象处理为一个词法作用域，对象属性被定义为在这个作用域内的词法标示符。块内部的`var`声明会被添加到`with`所处的函数作用域中。

不推荐使用`eval`和`with`：

- 严格模式下禁止使用
- 无法优化代码(作用域查找优化)

---

### 函数作用域和块作用域

函数作用域分级的好处：

- 隐藏内部实现

- 避免冲突

函数声明不可以是匿名的，函数表达式可以是匿名的。

匿名函数缺点：

- 匿名函数在栈上不会显示出有意义的函数名，调式困难

- 没有函数名，只能通过`argument.callee`调用自身，在严格模式下不可用

- 匿名函数可读行不高

立即执行的函数表达式

``` javascript

(function foo() {
  var a = 3;
  console.log(a);
})();

```

第一个括号用于把函数变成一个表达式，第二个括号用于执行这个函数。

IIFE的作用：

- 把它当做函数调用，可以传入参数

- 解决`undefined`标示符默认值被覆盖问题

- 倒置代码的运行顺序，`UMD`模式


创建块作用域的方法：

- with


- try/catch

`catch`分句会创建一个块作用域，其中声明的变量仅仅在`catch`内部有效。

- let

`es6`新语法关键字，`let`定义的变量不会在块作用域中进行提升。

- const
`es6`新语法关键字，`const`同样可以创建块作用域变量，其值是固定的。

---

### 提升

>包括变量和函数在内的所有声明都会在任何代码被执行前首先被处理（编译阶段）。

规则：

- 只有声明会被提升、赋值不会
- 函数表达式不会被提升
- 函数首先被提升，然后才是变量
- 重复声明被忽略

---

### 闭包

>通过任何手段，将内部函数传递到所在的词法作用域以外，它都会持有对原始定义作用域的引用，无论在何处执行这个函数都会使用闭包。

循环和闭包问题：
>循环迭代的过程中引用同一个变量。

解决办法：

- 1、IIFE

 新建一个块作用域，并且每次都把变量传递进来。

- 2、let
 
`for`循环头部的`let`声明有一个特殊行为： `变量在循环过程中不止声明一次。`


#### 利用闭包构建模块

模块模式的条件：

- 必须有外部封闭的函数，该函数必须至少调用一次。

- 封闭函数必须至少放回一个内部函数，这样内部函数才能在私有作用域内形成闭包，并且可以访问或者修改私有的状态。


#### 箭头函数与词法作用域

好处：

- 用当前的词法作用域覆盖了`this`本来的值。

问题：

- 它是匿名的而非具名

---

## this和对象原型

### `this`是什么

>this既不指向自身，也不指向函数的词法作用域，`this`实际上是在函数调用时发生的绑定。

---

### 全面解析`this`

`this`的绑定规则：

- 默认绑定

`this`指向全局对象。严格模式下无法使用（函数本身是严格模式）。

- 隐式绑定

对象属性引用炼只有最后一层会影响调用位置。

- 显式绑定

通过`apply`、`call`、`bind`来完成。

- new 绑定

`new`调用一个函数发生的操作：

- 1、创建一个全新对象
- 2、这个新对象会被执行[[原型]]连接
- 3、这个新对象会绑定到函数调用的`this`
- 4、如果这个函数没有放回其他对象，那么`new`表达式中的函数调用会自动返回这个新对象。

绑定优先级：

>默认绑定优先级最低，显式绑定优先级别高于隐式绑定。`new`绑定高于显式绑定。

### 对象

js基本类型：

- string
- number
- boolean
- null
- undefined
- object

`null`由于语言本身的`BUG`执行`typeof`会返回`object`。

内值对象子类型：

- String
- Number
- Function
- Object
- Array
- Boolean
- Date
- RegExp
- Error

#### 属性描述符号：

- writable

决定是否可以修改属性的值

- configurable

决定是否可以用`defineProperty`修改属性。`configurable:false`的属性，禁止删除。

- enumerable

决定是否出现在对象属性的枚举中。

#### 不变性

- 1、结合使用writable和configure

- 2、禁止扩展

Object.preventExtensions

- 3、密封

Object.seal=Object.preventExtensions + configurable:false
但是可以修改属性

- 4、冻结

Object.freeze=Object.seal + writable:false;

#### 属性的存在性

- 1、in

检查是否在元素本身，以及原型链中。

- 2、hasOwnProperty

检查是否在对象本身。

- 3、peopertyIsEnumerable

检查属性名是否直接存在于对象中，而且`enumerable:true`。

- 4、Object.keys

返回一个对象本身所有可以枚举的属性

- 5、Object.getOwnPropertyNames

返回对象包含的所有属性(不含原型链)，不论是否可以枚举。


#### 遍历

- 1、for in

遍历对象可以枚举的属性，包含原型链。

- 2、for

遍历数组

- 3、forEach\some\every

ES5添加的方法，用于遍历数组。

- 4、for..of

通过迭代器(Symbol.iterator)遍历数组或者对象。


### 原型

#### Object.prototype

>所有的[[prototype]]最终指向`Object.prototype`。其提供了一些方法，如`valueOf`等等。

`myObject.foo = "bar"`出现的情况：

- 1、[[prototype]]存在`foo`,并且可以写，那么会在myObject新建一个`foo`属性。

- 2、[[prototype]]存在`foo`,并且不可以写，严格模式报出错误。

- 3、[[prototype]]存在`foo`且是一个`setter`,那就一定会调用这个`setter`,`foo`不被添加，而且调用这个`setter`。


#### 基本原型关系：

```javascript

function Foo() {

}

var foo = new Foo();

Foo.prototype.__proto__ == Object.prototype
Function.prototype.__proto__ == Object.prototype
Array.__proto__ == Function.prototype
Foo.__proto__ == Function.prototype
foo.__proto__ == Foo.prototype

Foo.constructor == Function
foo.constructor == Foo

```

