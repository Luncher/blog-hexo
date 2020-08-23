---
title: Typescript 典型的类型问题
date: 2020-08-23 14:21:20
tags: [typescript]
categories: [typescript]
---

### 背景

现在越来越多的项目采用 `typescript` 作为主要的开发语言。在日常开发过程中，经常遇到几个常见的类型问题，在此做一个记录。

<!-- more -->

### 过滤数组空数据

假设当前项目中有如下代码片段：

```typescript
type FieldType = 'text' | 'long-text'

interface FieldBase {
  type: FieldType
  specifics?: {
    queryable?: boolean
    updatable?: boolean
  }
}

export interface FieldText extends FieldBase {
  type: 'text'
}

export interface FieldTextArea extends FieldBase {
  type: 'long-text'
}

export type FieldItem = FieldTextArea | FieldText

interface FormItem {
  type: string
  disabled?: boolean
  dataIndex: string
}

// 通过 `fieldItems` parse 得到 FormItem[]
function parseFormItems(field: FieldItem[]): FormItem[] {
  // 报错：Type 'undefined' is not assignable to type 'FormItem'
  return field.map(it => {
    it.specifics = { ...it.specifics, ...defaultSpefics}
    switch (it.type) {
      case 'text':
      case 'long-text': {
        return parseTextFormItem(it)
      }
      default: {
        throw new Error("invalid field type: " + it)
      }
    }
  })
}

// 通过 `fieldItem` parse 得到 FormItem
function parseTextFormItem(field: FieldItem): FormItem | undefined {
  if (!field.specifics) {
    return undefined
  }
  
  if (field.name === 'xxx') {
    return {
      type: 'string',
      disabled: false,
      dataIndex: '2'
    }
  }

  return {
    type: 'string',
    disabled: false,
    dataIndex: '1'
  }
}

```
上面的例子中，`ts` 报错了（在 `tsconfig` 开启了[strictNullChecks](https://www.typescriptlang.org/tsconfig#strictNullChecks)的前提下）：
**Type 'undefined' is not assignable to type 'FormItem'**

因为 `parseTextFormItem` 的返回值类型是`FormItem | undefined`，而 `undefined` 不能赋值给 `FormItem`。我们需要把 `undefined` 类型过滤掉。在 `typescript` 语言环境中，这种方式叫 [type-guard](https://luncher.github.io/2020/03/15/typescript-%E7%B1%BB%E5%9E%8B%E5%88%A4%E6%96%AD/) 。需要优化一下 `parseFormItems` 的实现：

```typescript
function parseFormItems(field: FieldItem[]): FormItem[] {
  return field.map(it => {
     //...
     // 过滤“空”值
  }).filter((it): it is FormItem => it != null)
}
```

---

### 把属性标记为 `Required`

在上面的例子，其中有一段代码是没有作用的：

```typescript
//...
function parseTextFormItem(field: FieldItem): FormItem | undefined {
  if (!field.specifics) {
    return undefined
  }
  //...
}
```

因为 `parseFormItems` 内部已经把 `specifics` 设置了默认值：
```typescript
//...
it.specifics = { ...it.specifics, ...defaultSpefics}
//...
```

所以在 `parseFormItems` 内部其实是不需要做这个条件判断的。这个时候需要变更一下函数的参数类型，把 `specifics` 设置为 `Required`。

我们需要一个把一个类型的某个属性设置为 `Required` 的工具类型。 `typescript` 没有内置可以直接使用的相关类型，但是可以通过它提供的其他类型拼凑出来：

```typescript
type RequiredProperty<T, K> = Exclude<T, K> & Required<Pick<T, K>>
```

改写 `parseTextFormItem`: 

```typescript
function parseTextFormItem(field: RequiredProperty<FieldItem, 'specifics'>): FormItem | undefined {
  //...
}
```
注意：
> 在实际的测试过程中，发现低于 `3.5` 版本的 `typescript` ，上面的方法不会生效，或许跟 [ts-3.5](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-5.html) 新增的特性有关。


另外，推荐使用 [ts-essentials](https://github.com/krzkaczor/ts-essentials)，它提供了强大的类型工具，满足日常开发的绝大多数场景。

---

### 访问/设置对象的属性值

刚学习 `typescrept` 的时候，经常遇到下面的错误提示：
>Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'XX'.
  No index signature with a parameter of type 'string' was found on type 'XX'

观察错误提示，其表示：`XX` 类型没有 `index signature`(索引签名)。这类错误一般出现在当我们需要动态访问对象的某个属性，或者给动态对象属性赋值的时候。看个例子：

```typescript
interface ISomeObject {
    firstKey:   string;
    secondKey:  string;
    thirdKey:   string;
}

let someObject: ISomeObject = {
    firstKey:   'firstValue',
    secondKey:  'secondValue',
    thirdKey:   'thirdValue'
};

let key: string = 'secondKey';

// 报错
let secondValue: string = someObject[key];
```

需要把 `ISomeObject` 类型改一下，给该类型加上 `index signature`：

```typescript
interface ISomeObject {
    firstKey:   string;
    secondKey:  string;
    thirdKey:   string;
    [key: string]: any
}
```

再看一个给对象动态赋值的例子：

```typescript
function clone<T extends {}>(obj: T): T {
  return Object.keys(obj).reduce((acc, cur) => {
  // 报错：Element implicitly has an 'any' type because type '{}' has no index signature
    acc[cur] = obj[cur]
    return acc
  }, {} as T)
}
```

需要把类型约束：`T extends {}` 修改一下，改成：`T extends {[k: string]: any}` 即可，表示该类型满足 `index signature`。


当 `typescript` 升级到 `3.5` 及以上的时候，情况又有所不同。因为
>T extends {[k: string]: any}

原则上并不是严格意义限制了 `T` 满足 `index signature`。这个时候需要做一点修正：

```typescript
function clone<T extends {[k: string]: any}>(obj: T): T {
  const result = Object.keys(obj).reduce((acc, cur) => {
    acc[cur] = obj[cur]
    return acc
  }, {} as {[k: string]: any})
  return result as T
}
```

`typescript 3.5` 对于 `index type` 校验问题更多的讨论，参考：[TypeScript/issues/31661](https://github.com/microsoft/TypeScript/issues/31661)。

---

### `Object` vs `object` vs `{}` vs `{[key: string]: any}`


#### `{}` 和 `Object`

`{}` 和 `Object` 在 `typescript` 环境下是等价的，任何类型的值都能赋值给该类型的变量：

```typescript
var p: {};
p = { prop: 0 }; // OK
p = []; // OK
p = 42; // OK
p = "string"; // OK
p = false; // OK
p = null; // Error
p = undefined; // Error
```

#### `object`

`object` 类型由 [typescript 2.2](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#object-type) 引入。其约束不能把原始类型赋值给该类型的数据：

```typescript
declare function create(o: object | null): void;

create({ prop: 0 }); // OK
create(null); // OK

create(42); // Error
create("string"); // Error
create(false); // Error
create(undefined); // Error
```


#### `{[key: string]: any}`

`{[key: string]: any}` 是 [index-signatures](https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types-and-index-signatures) 的类型，但是有一些奇怪的值（如：数组）也能绕过类型检查：

```typescript
var q: { [key: string]: any };
q = { prop: 0 }; // OK
q = []; // OK
q = 42; // Error
q = "string"; // Error
q = false; // Error
q = null; // Error
q = undefined; // Error
```

可以看到 `{[key: string]: any}` 类型约等于：`object` 类型，或许在某些时候，`{[key: string]: string}` 是更好的选择。


对比几种类型：

1、`{}` 等价于 `Object` 限制最为宽松，可以赋值任何对象、数组、原始类型值。
2、`object` 约等于：`{[key: string]: any}` ，不能赋值原始类型值，但是能赋值对象、数组。`{[key: string]: any}` 还起到了 `index signature` 的作用
3、`{ [key: string]: string }` 是更具体的类型，其不能赋值：数组、原始类型值、以及属性值不是字符串的对象。

---

### 参考

[index-types-and-index-signatures](https://www.typescriptlang.org/docs/handbook/advanced-types.html#index-types-and-index-signatures)
[type-guards-and-differentiating-types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types)
[ts-essentials](https://github.com/krzkaczor/ts-essentials)
[difference-between-object-and-in-typescript](https://stackoverflow.com/questions/49464634/difference-between-object-and-in-typescript)

