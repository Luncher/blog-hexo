---
title: Duck Type vs Structural Type vs Nominal Type
date: 2020-08-31 13:37:19
tags: 编程语言
categories: 编程语言
---
### 背景

`Duck Type` 、`Structural Type`、`Nominal Type` 是编程语言常用的类型系统规范。不同的编程语言采用不同的类型系统，有一些语言会采用三者之一作为主要的类型系统，部分支持支持其他类型系统。这里尝试通过不同的编程语言了解三种类型系统的差异性。

<!-- more -->

---

### Duck Type

`Duck Type` 中文称之为`鸭子类型`（以下统一称之为`鸭子类型`）。常见于动态类型风格的语言。其定义为：
>如果一个物体，它走路像鸭子、叫声也像鸭子，那么就可以认为它是鸭子。

在`鸭子类型`系统中，关注点不在于对象的类型，而在于对象实际被使用的方法、属性。如果依赖的对象的属性、方法不存在，那么可能会引发一个运行时错误。这是因为：
>`鸭子类型`通常得益于不校验方法、函数的参数类型，依赖文档、清晰的代码和测试来确保正确使用。

举个 `javascript` 的例子：

```javascript
class Person {
  name = 'lufy'
  age = 23
  sing() {
    console.log('Hi: ' + this.name + 'age: ' + this.age)
  }
}

class Dog {
  name = 'husky'
  sing() {
    console.log('Hi: ' + this.name)
  }
}

let v1 = new Person()
let v2 = new Dog()

function applySing(obj) {
  obj.sing()
}

applySing(v1)
applySing(v2)

```

在上面的代码中，如果按照结构化类型系统（`Structural Type`）的理解，`Dog` 和 `Person` ，因为属性不完全相等，所以它们是不同类型（下面会分析）。如果按照标称类型系统(`Nominal Type`)的理解，通常类名称就表示了变量的类型（下面会分析）。`Dog` 类型和 `Person` 属于不同的类型。而这正是 `鸭子类型` 的好处，比较灵活。把负担都交给了：文档、测试、以及程序员对代码上下文的理解。

#### Duck Type 的问题

`鸭子类型`的坏处通常是因为它太灵活了。问题的本质在于：

>“如果它走起来像鸭子并且叫起来像鸭子”，它也可以是一只正在模仿鸭子的人。

在实际的编码中，不能指望"人"做所有鸭子能做的事情（比如下蛋 ==|| ），而**这一切都只能通过测试和对当前代码库的上下文拥有足够的了解来解决**。
而 `Structural Type` 能够一定程度缓解这种问题。

---

### Structural Type
Structural Type 中文称之为：`结构化类型`（为了方便起见，以下简称`结构类型`），通常又称它为：基于属性的类型系统（`property-base type system`）其定义为：
>基于对象实际包含的属性类型来决定，两个变量是否兼容性和等价。既不是通过对象所属类型的名字来判断（`nominal type`）。也不是通过运行时访问对象某个属性或者方法来决定类型的兼容性（`duck type`）。

目前在前端领域非常火热的 `typescript` 就是基于该类型系统。

看个例子：

```typescript

class Person {
  name = 'lufy'
  sing() {
    console.log('Hi: ' + this.name + 'age: ')
  }
}

class Dog {
  name = 'husky'
  sing() {
    console.log('Hi: ' + this.name)
  }
}

let v1 = new Person()
let v2 = new Dog()

// ok
v1 = v2

```

因为 `Person` 和 `Dog` 的属性、方法完全等价所以 `v1` 和 `v2` 两个对象能够互相赋值，这种行为在`结构类型`系统下是完全允许的。

把 `Person` 类型改造一下：

```typescript

class Person {
  name = 'lufy'
  age = 23
  sing() {
    console.log('Hi: ' + this.name + 'age: ')
  }
}

//...

// Property 'age' is missing in type 'Dog' but required in type 'Person'
v1 = v2
```

因为 `v1` (`Person` 类型) 具有 `age` 属性而 `v2`（`Dog` 类型）没有该属性，所以赋值操作是非法的。但是反过来赋值是允许的：

```typescript

//...

// ok
v2 = v1
```

更多信息，参考 [type-compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)。

#### Structural type 的问题

因为 `Structural type` 基于变量所属类型的属性和方法的类型判断类型的兼容性，这也有可能导致一些非预期的行为。而这，只能通过 `Nominal Type` 来解决。

---

### Nominal Type

`Nominal Type` 又称之为：`name-based type system`，按照字面意思：**基于名称的类型系统**。其定义为：

>通过显示的声明，或者类型的名称来决定变量是否兼容和相等。

常见的基于 `Nominal Type` 作为类型系统的语言有：
`C`、`C++`、`Java`、`C#` 等。

看个 `C` 语言的例子：

```C
#include <stdio.h>

struct typeA {
  int foo;
};

struct typeB {
  int foo;
};

int main() {
  struct typeA a;
  struct typeB b;

  // error: assigning to 'struct typeB' from incompatible type 'struct typeA'
  b = a;
}
```

---

### 总结

+ `Duck Type` 类型系统非常灵活，**它只校验了代码实际过程中会使用的属性和方法**，但是这种校验只能通过：文档、测试、开发人员对系统的熟悉程度来保证，很有可能会导致代码产生运行时错误。
+ `Structural Type` 类型**基于变量类型包含的属性和方法的类型来判断**变量是否兼容。对比 `Duck Type`，它牺牲了一定的灵活性，但是得到了很好的安全性保障，减少开发人员的心智负担。
+ `Nominal Type` 又称之为基于名称的类型系统。对比 `Structural Type` 类型系统更加严格，可以有效的解决 `Structural Type` 导致的不想干的两个类型，由于拥有相同的属性和方法被判定类型兼容的问题。


---

### 参考

- [Nominal_type_system](https://en.wikipedia.org/wiki/Nominal_type_system)
- [typescript-type-compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)
- [type-systems-structural-vs-nominal-typing-explained](https://medium.com/@thejameskyle/type-systems-structural-vs-nominal-typing-explained-56511dd969f4)
- [duck-type](https://zh.wikipedia.org/wiki/%E9%B8%AD%E5%AD%90%E7%B1%BB%E5%9E%8B)
