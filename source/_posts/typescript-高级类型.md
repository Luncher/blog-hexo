---
title: typescript 高级类型
date: 2020-03-30 01:25:58
tags: typescript
categories: web
---

随着对 `typescript` 语言的逐渐深入实践，一些高级特性是必须掌握的，包括但不限于：`Index types`、`Mapped types`、`Conditional types` 等。一些名称听起来比较陌生，但实际情况是：其中一些类型可能已经在用了，另外一些奇怪的类型问题，或许都可以通过这些高级特性来解决。

<!-- more -->

### top type vs bottom type

为了更好的理解高级类型的用法，先了解两个基本的概念：`top type` 、`bottom type`。

#### top type

> 变量的容器，任何类型的变量都可以赋值给它们。`typescript` 包含两个 `top type`: `any`、`unknow`。对于这两个类型，它们有一些细微的差别。

- any

对于 `any` 类型的变量，在使用的时候 ts 编译器不会进行类型检查

例如：

```ts
function testAny(arg: any) {
  // 不会报错
  console.log(arg.fake())
}
```

- unknow

对于 `unknow` 类型的变量，在使用的时候 ts 编译器会要求先进行类型 `check`，否则报错。

```ts
function testUnknow(arg: unknown) {
  // 报错: Object is of type 'unknown'
  console.log(arg.fake())
  //          ^^^
}
```

#### bottom type

> 表示没有其他类型(除了它自己)的变量可以对它赋值的类型。`ts` 有一个 `bottom type`：`never`。常常用于断言(`assert`)某种情况不会发生。

举个例子：

```ts
function testNever(arg: never): never {
  throw new Error('test ' + arg)
}

function main() {
  //...
  // Argument of type '"123"' is not assignable to parameter of type 'never'.
  testNever('123')
  //        ^^^^
}
```

---

### Assignability(可分配性)

`ts` 采用 [structural typing](https://en.wikipedia.org/wiki/Structural_type_system) 的类型系统，该类型系统类似于 `js`熟知的 [duck typing](https://en.wikipedia.org/wiki/Duck_typing) 。系统关注的是类型实际提供的能力，而不是类型的名称、继承关系等。

在 `ts` 的类型系统检查类型 `可分配性` 的常用关键字是：`extends` ，常用的写法：

```ts
A extends B
```

含义：
> `A` 类型可以赋值给 `B` 类型。换句话说，`A` 是比 `B` 更加具体的类型, 或者同等类型。

举个例子：

```ts
function hello(arg: string | number) {
  //...
}

// ok
hello(123)
// ok
hello('123')
// error: Argument of type 'false' is not assignable to parameter of type 'string | number'
hello(false)
```

---

### index type

使用 `index type` 主要目的是便于编译器帮我们校验使用 `动态属性名称` 的时候的类型安全问题。

看个例子 `从某个对象挑选部分的属性，返回一个新的对象`：

```ts
// T: 对象类型
// keyof T: 对象的 `public propery names`
function pick<T, K extends keyof T>(arg: T, ...keys: K[]): {[P in K]: T[P]} {
  return keys.reduce<T>((acc, cur) => {
    acc[cur] = arg[cur]
    return acc
  }, {} as T)
}

const arg = { a: 1, b: 2 }
const result = pick(arg, 'a')
// { a: 1 }
console.log(result)
```

`index type` 包含两个基本的概念：

+ index query
>keyof T，返回 `T` 这个类型的公有属性(`public property name`)，是一个 `union type`

+ index access
>T[P]， P 表示属性名称（通过 `keyof 生成`），返回某个属性的数据类型

---

### mapped type

`mapped type` 利用 `index type` 的能力，主要用于处理 `object` 类型的领域，返回一个全新的 `object` 类型，或者修改部分属性的修饰信息（`modifiters`）

举个例子：

```ts
// 移除属性的 `readonly` 特性
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

interface Itest {
  readonly a: number
  readonly b: string
}

//type MutableITest = {
//    a: number;
//    b: string;
//}
type MutableITest = Mutable<Itest>

```

`mapped type` 通常分为两个类型：

#### homomorphic
> 在类型处理过程中，不会添加新的属性。`ts` 处理的时候，先从输入的类型拷贝一份旧的属性修饰信息，然后在这个基础之上做修改。

`ts` 内置的 `homomorphic` 类型如：

+ Partial
```ts
type Partial<T> = {[P in keyof T]?: T[P]}
```
+ Required
```ts
type Required<T> = {[P in keyof T]-?: T[P]}
```
+ Pick
```ts
type Pick<T, K extends keyof T> = {[P in K]: T[P]}
```
+ ...

#### non homomorphic 类型
>在类型处理的过程中会生成新的属性。

`ts` 内置的 `homomorphic` 类型如：

+ Record
```ts
type Record<T extends key of any, P> = {[K in T]: P}
```
> *key of any* 等于 `string | number | symbol`。表示 `object` 类型的 `key` 的合法属性类型。

`Record` 返回一个新的 `object type`。对于这类型的高级类型，通常称之为：`non homomorphic`

---

### conditional type

如果要算 `ts` 里面使用最广泛的高级类型，那么非`条件类型`莫属。[条件类型](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html) 最初在 `ts2.8` 版本的时候引入。写法规则：

```ts
T extends U ? X : Y
```
>条件类型的写法跟三元运算符类似。

比较常用的场景如：

```ts
type XTrue<T> = T extends bool ? true : never
```
>如果 `T` 是 `boolean` 类型，则 `XTrue<T>` 等于 `true` 类型，否则等于 `never` 类型。

#### distributive conditional
分散形式的条件类型主要用于处理 `union type`，使用的场景非常多。有两个先决条件：
+ `union type` 必须绑定到类型变量(`<>`符号内)
+ `union type` 类型变量必须单独出现在 `extends` 关键字左边

**举个例子：**


```ts
type NonNullableX<T> = T extends null | undefined ? never : T

//string | number
type TX = NonNullableX<string|number|null|undefined>

```

针对上面的例子做一个详细的分解：

```ts
// 1. 代入类型
type TX = NonNullableX<
| string
| number
| null
| undefined
>

// 2. 展开类型
type TX = 
| NonNullableX<string>
| NonNullableX<number>
| NonNullableX<null>
| NonNullableX<undefined>

// 3. 替换表达式
type TX =
| (string extends null | undefined ? never : T)
| (number extends null | undefined ? never : T)
| (null extends null | undefined ? never : T)
| (undefined extends null | undefined ? never : T)

// 4. 计算表达式的值
type TX =
| string
| number
| never
| never

// 5. never 在 union type 里面没有意义，直接忽略
type TX = string | number
```


**在看一个项目中实际遇到过的例子**

假设现在有几个类型，其关系如下：

```ts

interface IBase {
    base: string
}

interface IChildren1 extends IBase {
    type: 'children1'
    foo: number
}

interface IChildren2 extends IBase {
    type: 'children2'
    bar: string
}

```

目标：生成一个类型，达到 `IChildren1 | IChildren2` 的效果，但是不要包含 `IBase` 的内容信息。

结论：

```ts
type Info = IChildren1 | IChildren2

type DistributiveOmit<T, K extends keyof T> = T extends any
  ? Omit<T, K>
  : never
// type IResult = Pick<IChildren1, "type" | "foo"> | Pick<IChildren2, "type" | "bar">
type IResult = DistributiveOmit<Info, keyof IBase>
```

---

#### infer type

`ts` 里面有很多需要根据一个类型推断出另外一个类型的情形。如

获取函数的返回值类型：
```ts
type ReturnType<T> = T extends (...args: any) => infer U ? U : never
```

获取类的构造参数类型：
```ts
type ConstructorParameters<T extends new (...args: any) => any> = T extends new (...args: infer P) => any ? P : never
```

关于 `infer` 的使用有几个约束：
+ `infer` 不能出现在 `类型约束` 里面(即：`<>`里面)
+ `infer` 只能出现在 `extends` 的右边
+ `infer` 推断的类型只能用在 `true branch`

---

### 总结

+ 分析了 `ts` 的 `top type` 和 `bottom type` 的区别
+ 对 `ts` 的 `Assignability` 进行了讨论，了解 `ts` 的限制以及同其他语言的区别
+ `Index type` 主要包含了：`index query` 和 `index access`，这是其他类型如：`mapped type` 和 `conditional type` 的基础
+ `mapped type` 分为 `homomorphic` 和 `no homomorphic` 两个类型。主要区别在于是否生成新的属性，还是仅仅对现有的属性描述信息进行修改
+ `conditional type` 是使用最为广泛的高级类型。形式类似于 `三元运算符`，但是只是作用于类型，而不是实际的值。`distributive conditional` 常常用于处理 `union type` 得到更加精确的类型，`infer type` 用于推导某个参数的类型

---

### 参考

[typescript-lang-advanced-types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)

[mariusschulz-conditional-types-in-typescript](https://mariusschulz.com/blog/conditional-types-in-typescript)

[artsy-conditional-types-in-typescript](https://artsy.github.io/blog/2018/11/21/conditional-types-in-typescript)

[the conditional types-pr](https://github.com/Microsoft/TypeScript/pull/21496)
